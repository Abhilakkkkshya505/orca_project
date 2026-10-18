"""
Deterministic risk assessment rules engine.
Pure functions only: no database, no LLM, no clock reads, no network.
Every safety rating is derived entirely from structured metrics and thresholds.
"""

from dataclasses import dataclass

from apps.risk.thresholds import MAX_DATA_AGE_HOURS, RULES_VERSION, THRESHOLDS


@dataclass(frozen=True)
class FactorInput:
    key: str
    label: str
    value: float | None
    unit: str
    source: str
    observed_at: str | None
    age_hours: float | None


@dataclass(frozen=True)
class AdvisoryInput:
    id: str
    headline: str
    severity: str  # info, watch, warning, severe
    source: str
    age_hours: float | None


@dataclass(frozen=True)
class RiskInput:
    vessel_class: str  # small_craft or mechanised
    factors: list[FactorInput]
    active_advisories: list[AdvisoryInput]


@dataclass
class FactorOutput:
    key: str
    label: str
    value: float | None
    unit: str
    level: str  # safe, caution, unsafe, unknown
    caution_at: float | None
    unsafe_at: float | None
    source: str
    observed_at: str | None
    data_age_minutes: int | None


@dataclass
class RiskResult:
    level: str  # safe, caution, unsafe, unknown
    factors: list[FactorOutput]
    advisories: list[dict]
    missing_or_stale: list[str]
    rules_version: str
    disclaimer: str = "Official warnings override ORCA. Thresholds are development placeholders."


def evaluate_factor_level(
    key: str, value: float | None, age_hours: float | None, vessel_class: str
) -> tuple[str, float | None, float | None]:
    """
    Evaluates risk level for a single oceanographic or meteorological factor.
    Returns: (level, caution_threshold, unsafe_threshold)
    """
    class_thresholds = THRESHOLDS.get(vessel_class, THRESHOLDS["small_craft"])
    band = class_thresholds.get(key)
    max_age = MAX_DATA_AGE_HOURS.get(key, 12.0)

    if value is None or age_hours is None or age_hours > max_age:
        return "unknown", (band.caution if band else None), (band.unsafe if band else None)

    if not band:
        return "safe", None, None

    # For wave period: lower values mean steeper, more dangerous waves
    if key == "wave_period_s":
        if value <= band.unsafe:
            return "unsafe", band.caution, band.unsafe
        if value <= band.caution:
            return "caution", band.caution, band.unsafe
        return "safe", band.caution, band.unsafe

    # For wave height, wind speed, gusts, rain: higher values mean more dangerous
    if value >= band.unsafe:
        return "unsafe", band.caution, band.unsafe
    if value >= band.caution:
        return "caution", band.caution, band.unsafe
    return "safe", band.caution, band.unsafe


def compute_risk(risk_input: RiskInput) -> RiskResult:
    """
    Deterministic risk calculation algorithm:
    1. For each factor, determine level ('safe', 'caution', 'unsafe', 'unknown').
    2. Missing or stale data produces 'unknown'. Never default to 'safe'.
    3. Any active 'warning' or 'severe' official advisory forces overall level to 'unsafe'.
    4. Otherwise, overall level is the worst factor level ('unsafe' > 'caution' > 'safe').
    """
    vessel_class = risk_input.vessel_class
    if vessel_class not in THRESHOLDS:
        vessel_class = "small_craft"

    factor_outputs: list[FactorOutput] = []
    missing_or_stale: list[str] = []
    factor_levels: list[str] = []

    # Required core factors that must be present and fresh
    required_keys = {"wave_height_m", "wind_speed_kmh"}
    present_keys = set()

    for f in risk_input.factors:
        present_keys.add(f.key)
        lvl, caution_at, unsafe_at = evaluate_factor_level(f.key, f.value, f.age_hours, vessel_class)
        factor_levels.append(lvl)

        age_mins = int(f.age_hours * 60) if f.age_hours is not None else None
        factor_outputs.append(
            FactorOutput(
                key=f.key,
                label=f.label,
                value=f.value,
                unit=f.unit,
                level=lvl,
                caution_at=caution_at,
                unsafe_at=unsafe_at,
                source=f.source,
                observed_at=f.observed_at,
                data_age_minutes=age_mins,
            )
        )

        if lvl == "unknown":
            reason = "missing" if f.value is None else "stale"
            missing_or_stale.append(f"{f.label} ({reason})")

    # Check for completely absent required factors
    for req in required_keys:
        if req not in present_keys:
            missing_or_stale.append(f"{req} (missing)")
            factor_levels.append("unknown")

    # Evaluate official advisories
    active_advisories_payload = []
    advisory_forced_unsafe = False

    for adv in risk_input.active_advisories:
        active_advisories_payload.append(
            {
                "id": adv.id,
                "headline": adv.headline,
                "severity": adv.severity,
                "source": adv.source,
            }
        )
        # Check advisory freshness
        max_adv_age = MAX_DATA_AGE_HOURS.get("advisories", 6.0)
        if adv.age_hours is not None and adv.age_hours > max_adv_age:
            missing_or_stale.append(f"Advisory {adv.id} (stale)")

        # Severe or warning advisory forces unsafe
        if adv.severity in ("warning", "severe"):
            advisory_forced_unsafe = True

    # Deterministic Overall Level Decision
    if advisory_forced_unsafe:
        overall_level = "unsafe"
    elif "unknown" in factor_levels:
        # Non-negotiable safety rule: missing or stale required factor yields unknown, never safe
        overall_level = "unknown"
    elif "unsafe" in factor_levels:
        overall_level = "unsafe"
    elif "caution" in factor_levels:
        overall_level = "caution"
    else:
        overall_level = "safe"

    return RiskResult(
        level=overall_level,
        factors=factor_outputs,
        advisories=active_advisories_payload,
        missing_or_stale=missing_or_stale,
        rules_version=RULES_VERSION,
    )
