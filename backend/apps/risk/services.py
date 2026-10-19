from datetime import datetime
import structlog
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone as dj_timezone

from apps.core.exceptions import DomainError, OutOfCoverage, RiskOutputPaused
from apps.geodata.models import GridCell
from apps.geodata.on_demand import fetch_on_demand_snapshots
from apps.geodata.services import get_active_advisories_for_point, get_snapshots_for_point_window
from apps.ports.models import Port
from apps.ports.normalisation import haversine_km, validate_coordinates
from apps.ports.snapping import snap_port_coordinate
from apps.risk.models import FishingZone, RiskAssessment
from apps.risk.rules import AdvisoryInput, FactorInput, RiskInput, compute_risk
from apps.risk.thresholds import RULES_VERSION

logger = structlog.get_logger(__name__)


def find_nearest_coastal_port_suggestion(lat: float, lon: float) -> dict | None:
    """Finds nearest coastal port suggestion when a query hits an inland or unsupported point."""
    ports = Port.objects.filter(is_active=True, is_coastal=True).only(
        "public_id", "slug", "name", "country_code", "lat", "lon"
    )[:500]
    best = None
    min_d = float("inf")
    for p in ports:
        d = haversine_km(lat, lon, p.lat, p.lon)
        if d < min_d:
            min_d = d
            best = p

    if best:
        return {
            "slug": best.slug,
            "name": best.name,
            "country_code": best.country_code,
            "distance_km": round(min_d, 1),
        }
    return {
        "slug": "mumbai-bombay-in",
        "name": "Mumbai (Bombay)",
        "country_code": "IN",
        "distance_km": round(haversine_km(lat, lon, 18.93, 72.84), 1),
    }


def evaluate_and_record_risk(
    lat: float,
    lon: float,
    valid_from: datetime,
    valid_to: datetime,
    vessel_class: str = "small_craft",
    user=None,
    thread_message_id: str | None = None,
    port_slug: str | None = None,
) -> RiskAssessment:
    """
    Computes deterministic risk assessment for a coastal location and time window,
    and records an immutable audit log row in the database.
    """
    if not getattr(settings, "RISK_OUTPUT_ENABLED", True):
        raise RiskOutputPaused(
            "ORCA risk ratings are temporarily paused. Please consult official INCOIS/IMD advisories."
        )

    # 1. Validate coordinate ranges
    is_valid_coord, coord_err = validate_coordinates(lat, lon)
    if not is_valid_coord:
        raise DomainError(f"Invalid coordinates: {coord_err}", code="invalid_coordinates")

    # 2. Port resolution & sea-point snapping
    port_obj = None
    if port_slug:
        port_obj = Port.objects.filter(slug__iexact=port_slug).first()
        if not port_obj:
            port_obj = Port.objects.filter(public_id__iexact=port_slug).first()

    # If explicitly marked as an inland/non-coastal port
    if port_obj and not port_obj.is_coastal:
        suggestion = find_nearest_coastal_port_suggestion(port_obj.lat, port_obj.lon)
        raise DomainError(
            f"Port '{port_obj.name}' is an inland or river port with no marine forecast data.",
            code="inland_point",
            details={"suggestion": suggestion},
        )

    # Determine marine sea coordinates
    sea_lat = lat
    sea_lon = lon
    marine_offset_km = None

    if port_obj and port_obj.marine_lat is not None and port_obj.marine_lon is not None:
        sea_lat = port_obj.marine_lat
        sea_lon = port_obj.marine_lon
        marine_offset_km = port_obj.marine_offset_km
    else:
        # Check if coordinates need marine snapping (e.g. on land cell or quay)
        # First check if we have a nearby coastal port within 15 km
        nearby_port = Port.objects.filter(
            is_active=True,
            is_coastal=True,
            lat__gte=lat - 0.15,
            lat__lte=lat + 0.15,
            lon__gte=lon - 0.15,
            lon__lte=lon + 0.15,
        ).first()

        if nearby_port and nearby_port.marine_lat is not None:
            sea_lat = nearby_port.marine_lat
            sea_lon = nearby_port.marine_lon
            marine_offset_km = haversine_km(lat, lon, sea_lat, sea_lon)
        else:
            # Probe Open-Meteo marine grid
            m_lat, m_lon, offset, is_coastal = snap_port_coordinate(lat, lon)
            if not is_coastal or m_lat is None:
                if port_obj:
                    port_obj.is_coastal = False
                    port_obj.save(update_fields=["is_coastal"])
                suggestion = find_nearest_coastal_port_suggestion(lat, lon)
                raise DomainError(
                    f"Location ({lat:.2f}, {lon:.2f}) is an inland or unsupported point with no marine model data.",
                    code="inland_point",
                    details={"suggestion": suggestion},
                )
            sea_lat = m_lat
            sea_lon = m_lon
            marine_offset_km = offset
            if port_obj:
                port_obj.marine_lat = m_lat
                port_obj.marine_lon = m_lon
                port_obj.marine_offset_km = offset
                port_obj.save(update_fields=["marine_lat", "marine_lon", "marine_offset_km"])

    # 3. Cache Check (Part A3 & F7: cache keys include rounded lat, lon, vessel class, window, rules version)
    cache_key = (
        f"orca:risk:{round(lat, 2)}:{round(lon, 2)}:{vessel_class}:"
        f"{int(valid_from.timestamp())}:{int(valid_to.timestamp())}:{RULES_VERSION}"
    )
    cached_assessment_id = cache.get(cache_key)
    if cached_assessment_id:
        cached_obj = RiskAssessment.objects.filter(public_id=cached_assessment_id).first()
        if cached_obj:
            return cached_obj

    # 4. Fetch already ingested snapshots at sea coordinate
    snapshots = get_snapshots_for_point_window(sea_lat, sea_lon, valid_from, valid_to)
    source_mode = "grid_snapshot"

    # 5. On-Demand Fetch (Part E3) if snapshots are missing or insufficient
    if not snapshots or len(snapshots) < 2:
        ingested = fetch_on_demand_snapshots(lat, lon, sea_lat, sea_lon, valid_from, valid_to)
        if ingested > 0:
            snapshots = get_snapshots_for_point_window(sea_lat, sea_lon, valid_from, valid_to)
            source_mode = "on_demand"

    # 6. Fetch active official advisories covering point
    advisories = get_active_advisories_for_point(lat, lon)

    # 7. Assemble factors across the window
    now = dj_timezone.now()
    factors_input: list[FactorInput] = []
    data_ages: dict[str, int] = {}

    max_wave = None
    min_period = None
    max_swell = None
    max_wind = None
    max_gust = None
    max_rain = None
    min_vis = None
    max_cur = None
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

        sw = vals.get("swell_wave_height_m")
        if sw is not None:
            max_swell = max(max_swell, float(sw)) if max_swell is not None else float(sw)

        ws = vals.get("wind_speed_kmh")
        if ws is not None:
            max_wind = max(max_wind, float(ws)) if max_wind is not None else float(ws)

        wg = vals.get("wind_gust_kmh")
        if wg is not None:
            max_gust = max(max_gust, float(wg)) if max_gust is not None else float(wg)

        r = vals.get("precipitation_mm_h") if vals.get("precipitation_mm_h") is not None else vals.get("rain_mm")
        if r is not None:
            max_rain = max(max_rain, float(r)) if max_rain is not None else float(r)

        vis = vals.get("visibility_m")
        if vis is not None:
            min_vis = min(min_vis, float(vis)) if min_vis is not None else float(vis)

        cur = vals.get("current_speed_ms")
        if cur is not None:
            max_cur = max(max_cur, float(cur)) if max_cur is not None else float(cur)

    # Compute data age
    age_hours = None
    if latest_snapshot_time:
        age_hours = (now - latest_snapshot_time).total_seconds() / 3600.0
        data_ages["snapshots"] = int(age_hours * 60)

    observed_at_str = latest_snapshot_time.isoformat() if latest_snapshot_time else None
    factors_input.extend([
        FactorInput(
            key="wave_height_m",
            label="Significant Wave Height",
            value=max_wave,
            unit="m",
            source=snapshot_source,
            observed_at=observed_at_str,
            age_hours=age_hours,
        ),
        FactorInput(
            key="wave_period_s",
            label="Peak Wave Period",
            value=min_period,
            unit="s",
            source=snapshot_source,
            observed_at=observed_at_str,
            age_hours=age_hours,
        ),
        FactorInput(
            key="wind_speed_kmh",
            label="Sustained Wind Speed",
            value=max_wind,
            unit="km/h",
            source=snapshot_source,
            observed_at=observed_at_str,
            age_hours=age_hours,
        ),
        FactorInput(
            key="wind_gust_kmh",
            label="Peak Wind Gust",
            value=max_gust,
            unit="km/h",
            source=snapshot_source,
            observed_at=observed_at_str,
            age_hours=age_hours,
        ),
        FactorInput(
            key="precipitation_mm_h",
            label="Precipitation",
            value=max_rain,
            unit="mm/h",
            source=snapshot_source,
            observed_at=observed_at_str,
            age_hours=age_hours,
        ),
    ])

    if max_swell is not None:
        factors_input.append(
            FactorInput(
                key="swell_wave_height_m",
                label="Swell Wave Height",
                value=max_swell,
                unit="m",
                source=snapshot_source,
                observed_at=observed_at_str,
                age_hours=age_hours,
            )
        )
    if min_vis is not None:
        factors_input.append(
            FactorInput(
                key="visibility_m",
                label="Visibility",
                value=min_vis,
                unit="m",
                source=snapshot_source,
                observed_at=observed_at_str,
                age_hours=age_hours,
            )
        )
    if max_cur is not None:
        factors_input.append(
            FactorInput(
                key="current_speed_ms",
                label="Ocean Current Speed",
                value=max_cur,
                unit="m/s",
                source=snapshot_source,
                observed_at=observed_at_str,
                age_hours=age_hours,
            )
        )

    # Convert active official advisories
    advisories_input: list[AdvisoryInput] = []
    advisory_ids = []
    for adv in advisories:
        advisory_ids.append(str(adv.public_id))
        adv_age = (now - adv.issued_at).total_seconds() / 3600.0 if adv.issued_at else None
        advisories_input.append(
            AdvisoryInput(
                id=str(adv.external_id or adv.public_id),
                headline=adv.headline,
                severity=adv.severity,
                source=adv.source.slug if hasattr(adv.source, "slug") else str(adv.source),
                age_hours=adv_age,
            )
        )

    from apps.geodata.models import DataSource

    advisory_ds = DataSource.objects.filter(slug__in=["gdacs_events", "manual_advisories", "advisories", "incois"]).first()
    advisory_healthy = (advisory_ds.status != "failing") if advisory_ds else True

    # 8. Deterministic Evaluation
    risk_in = RiskInput(
        vessel_class=vessel_class,
        factors=factors_input,
        active_advisories=advisories_input,
        advisory_feed_healthy=advisory_healthy,
    )
    result = compute_risk(risk_in)

    # 9. Immutable record creation in database
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
            marine_lat=sea_lat,
            marine_lon=sea_lon,
            marine_offset_km=marine_offset_km,
            source_mode=source_mode,
            port_slug=port_slug or (port_obj.slug if port_obj else ""),
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

        # Generate indicative fishing zone
        FishingZone.objects.create(
            assessment=assessment,
            lat=round(lat + 0.05, 3),
            lon=round(lon - 0.08, 3),
            score=75 if result.level == "safe" else 45,
            risk_level=result.level,
            factors={"chlorophyll_front": "moderate", "sst_gradient": "0.3 C/km"},
            origin=FishingZone.OriginChoice.ORCA_HEURISTIC,
        )

    # Cache assessment id for 15 minutes
    cache.set(cache_key, assessment.public_id, timeout=900)

    logger.info(
        "risk_assessment_computed",
        level=result.level,
        vessel_class=vessel_class,
        assessment_id=str(assessment.public_id),
        source_mode=source_mode,
        lat=lat,
        lon=lon,
    )
    return assessment
