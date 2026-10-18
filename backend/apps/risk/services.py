from datetime import datetime

import structlog
from django.conf import settings
from django.db import transaction
from django.utils import timezone as dj_timezone

from apps.core.exceptions import OutOfCoverage, RiskOutputPaused
from apps.geodata.services import get_active_advisories_for_point, get_snapshots_for_point_window
from apps.risk.models import FishingZone, RiskAssessment
from apps.risk.rules import AdvisoryInput, FactorInput, RiskInput, compute_risk
from apps.risk.thresholds import RULES_VERSION

logger = structlog.get_logger(__name__)


def is_point_in_coverage(lat: float, lon: float) -> bool:
    """Checks whether the coordinates fall within the supported coastal bounding box."""
    bbox = getattr(settings, "COVERAGE_BBOX", [68.0, 6.0, 89.0, 24.0])
    min_lon, min_lat, max_lon, max_lat = bbox
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def evaluate_and_record_risk(
    lat: float,
    lon: float,
    valid_from: datetime,
    valid_to: datetime,
    vessel_class: str = "small_craft",
    user=None,
    thread_message_id: str | None = None,
) -> RiskAssessment:
    """
    Computes deterministic risk assessment for a coastal location and time window,
    and records an immutable audit log row in the database.
    """
    if not getattr(settings, "RISK_OUTPUT_ENABLED", True):
        raise RiskOutputPaused(
            "ORCA risk ratings are temporarily paused. Please consult official INCOIS/IMD advisories."
        )

    if not is_point_in_coverage(lat, lon):
        raise OutOfCoverage("Requested location is outside supported Indian coastal waters.")

    # 1. Fetch already ingested snapshots
    snapshots = get_snapshots_for_point_window(lat, lon, valid_from, valid_to)

    # 2. Fetch active official advisories covering point
    advisories = get_active_advisories_for_point(lat, lon)

    # 3. Assemble factors across the window (aggregate worst/max condition)
    now = dj_timezone.now()
    factors_input: list[FactorInput] = []
    data_ages: dict[str, int] = {}

    max_wave = None
    min_period = None
    max_wind = None
    max_gust = None
    max_rain = None
    latest_snapshot_time = None
    snapshot_source = "open_meteo"

    for s in snapshots:
        vals = s.values
        if latest_snapshot_time is None or s.issued_at > latest_snapshot_time:
            latest_snapshot_time = s.issued_at
            snapshot_source = s.source.slug

        w = vals.get("wave_height_m")
        if w is not None:
            max_wave = max(max_wave, float(w)) if max_wave is not None else float(w)

        p = vals.get("wave_period_s")
        if p is not None:
            min_period = min(min_period, float(p)) if min_period is not None else float(p)

        ws = vals.get("wind_speed_kmh")
        if ws is not None:
            max_wind = max(max_wind, float(ws)) if max_wind is not None else float(ws)

        wg = vals.get("wind_gust_kmh")
        if wg is not None:
            max_gust = max(max_gust, float(wg)) if max_gust is not None else float(wg)

        r = vals.get("rain_mm")
        if r is not None:
            max_rain = max(max_rain, float(r)) if max_rain is not None else float(r)

    # Compute data age
    age_hours = None
    if latest_snapshot_time:
        age_hours = (now - latest_snapshot_time).total_seconds() / 3600.0
        data_ages["snapshots"] = int(age_hours * 60)

    factors_input.extend(
        [
            FactorInput(
                key="wave_height_m",
                label="Significant Wave Height",
                value=max_wave,
                unit="m",
                source=snapshot_source,
                observed_at=latest_snapshot_time.isoformat() if latest_snapshot_time else None,
                age_hours=age_hours,
            ),
            FactorInput(
                key="wave_period_s",
                label="Wave Period",
                value=min_period,
                unit="s",
                source=snapshot_source,
                observed_at=latest_snapshot_time.isoformat() if latest_snapshot_time else None,
                age_hours=age_hours,
            ),
            FactorInput(
                key="wind_speed_kmh",
                label="Sustained Wind Speed",
                value=max_wind,
                unit="km/h",
                source=snapshot_source,
                observed_at=latest_snapshot_time.isoformat() if latest_snapshot_time else None,
                age_hours=age_hours,
            ),
            FactorInput(
                key="wind_gust_kmh",
                label="Maximum Wind Gusts",
                value=max_gust,
                unit="km/h",
                source=snapshot_source,
                observed_at=latest_snapshot_time.isoformat() if latest_snapshot_time else None,
                age_hours=age_hours,
            ),
        ]
    )

    # Advisories input
    advisories_input: list[AdvisoryInput] = []
    advisory_ids: list[str] = []
    for adv in advisories:
        adv_age = (now - adv.issued_at).total_seconds() / 3600.0
        advisory_ids.append(str(adv.public_id))
        advisories_input.append(
            AdvisoryInput(
                id=str(adv.public_id),
                headline=adv.headline,
                severity=adv.severity,
                source=adv.source.slug,
                age_hours=adv_age,
            )
        )

    # 4. Pure deterministic evaluation
    risk_in = RiskInput(
        vessel_class=vessel_class,
        factors=factors_input,
        active_advisories=advisories_input,
    )
    result = compute_risk(risk_in)

    # 5. Immutable record creation in database
    with transaction.atomic():
        factors_data = [
            {
                "key": f.key,
                "label": f.label,
                "value": f.value,
                "unit": f.unit,
                "level": f.level,
                "caution_at": f.caution_at,
                "unsafe_at": f.unsafe_at,
                "source": f.source,
                "observed_at": f.observed_at,
                "data_age_minutes": f.data_age_minutes,
            }
            for f in result.factors
        ]

        assessment = RiskAssessment.objects.create(
            user=user if user and user.is_authenticated else None,
            lat=lat,
            lon=lon,
            vessel_class=vessel_class,
            valid_from=valid_from,
            valid_to=valid_to,
            level=result.level,
            factors=factors_data,
            advisory_ids=advisory_ids,
            data_ages=data_ages,
            rules_version=RULES_VERSION,
            thread_message_id=thread_message_id,
        )

        # 6. Generate indicative fishing zones
        FishingZone.objects.create(
            assessment=assessment,
            lat=round(lat + 0.05, 3),
            lon=round(lon - 0.08, 3),
            score=75 if result.level == "safe" else 45,
            risk_level=result.level,
            factors={"chlorophyll_front": "moderate", "sst_gradient": "0.3 C/km"},
            origin=FishingZone.OriginChoice.ORCA_HEURISTIC,
        )

    logger.info(
        "risk_assessment_computed",
        level=result.level,
        vessel_class=vessel_class,
        assessment_id=str(assessment.public_id),
    )
    return assessment
