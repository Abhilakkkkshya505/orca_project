"""
Deterministic risk assessment rules engine.
Pure functions only: no database, no LLM, no clock reads, no network.
Every safety rating is derived entirely from structured metrics and thresholds.
NO imports from Django in this module.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from apps.risk.thresholds import (
    MAX_DATA_AGE_HOURS,
    RULES_VERSION,
    THRESHOLDS,
    Band,
)


@dataclass(frozen=True)
class FactorInput:
    key: str
    label: str
    value: float | None
    unit: str
    source: str
    observed_at: str | None = None
    age_hours: float | None = None
    data_age_minutes: int | None = None

    def get_effective_age_hours(self) -> float | None:
        if self.age_hours is not None:
            return self.age_hours
        if self.data_age_minutes is not None:
            return self.data_age_minutes / 60.0
        return None


@dataclass(frozen=True)
class AdvisoryInput:
    id: str
    headline: str
    severity: str  # info, watch, warning, severe
    source: str
    age_hours: float | None = None
    covers_point: bool = True
    active_in_window: bool = True


@dataclass(frozen=True)
class TimeWindow:
    valid_from: str | None = None
    valid_to: str | None = None


@dataclass(frozen=True)
class RiskInput:
    vessel_class: str  # small_craft or mechanised
    factors: list[FactorInput]
    active_advisories: list[AdvisoryInput] = field(default_factory=list)
    window: TimeWindow | None = None
    now: datetime | None = None
    advisory_feed_healthy: bool = True


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
    confidence: str  # high, medium, low
    factors: list[FactorOutput]
    advisories: list[dict[str, Any]]
    missing: list[str]
    flags: list[str]
    reasons: list[str]
    rules_version: str
    valid_from: str | None = None
    valid_to: str | None = None
    disclaimer: str = "Official warnings override ORCA. Thresholds are development placeholders."
    missing_or_stale: list[str] = field(default_factory=list)


def evaluate_factor_level(
    key: str, value: float | None, age_hours: float | None, vessel_class: str
) -> tuple[str, float | None, float | None]:
    """
    Evaluates risk level for a single oceanographic or meteorological factor.
    Returns: (level, caution_threshold, unsafe_threshold)
    """
    class_thresholds = THRESHOLDS.get(vessel_class, THRESHOLDS["small_craft"])
    band: Band | None = class_thresholds.get(key)
    max_age = MAX_DATA_AGE_HOURS.get(key, 12.0)

    if value is None or age_hours is None or age_hours > max_age:
        return "unknown", (band.caution if band else None), (band.unsafe if band else None)

    if not band:
        return "safe", None, None

    # Handle factors where lower values indicate greater hazard (e.g., period, visibility)
    if band.is_lower_worse:
        if value <= band.unsafe:
            return "unsafe", band.caution, band.unsafe
        if value <= band.caution:
            return "caution", band.caution, band.unsafe
        return "safe", band.caution, band.unsafe

    # Standard factors where higher values indicate greater hazard (wave height, wind, gust, rain)
    if value >= band.unsafe:
        return "unsafe", band.caution, band.unsafe
    if value >= band.caution:
        return "caution", band.caution, band.unsafe
    return "safe", band.caution, band.unsafe


def compute_wave_steepness(
    wave_height_m: float | None, wave_period_s: float | None
) -> float | None:
    """
    Calculates wave steepness index H / T^2.
    Formula: steepness = wave_height_m / (wave_period_s ** 2).
    """
    if wave_height_m is None or wave_period_s is None or wave_period_s <= 0.0:
        return None
    return wave_height_m / (wave_period_s**2)


def compute_risk(risk_input: RiskInput) -> RiskResult:
    """
    Deterministic risk calculation algorithm:
    1. Evaluates all incoming factors against vessel class thresholds.
    2. Calculates wave steepness if height and period are available.
    3. Missing or stale required factors ('wave_height_m', 'wind_speed_kmh') force 'unknown'.
    4. Active advisories covering the point in the window override:
       - 'severe' or 'warning' forces 'unsafe'.
       - 'watch' forces at least 'caution'.
    5. Overall level is the worst factor level ('unsafe' > 'caution' > 'safe' or 'unknown').
    6. Produces stable machine-readable reasons and flags.
    """
    vessel_class = risk_input.vessel_class
    if vessel_class not in THRESHOLDS:
        vessel_class = "small_craft"

    factor_outputs: list[FactorOutput] = []
    missing: list[str] = []
    missing_or_stale: list[str] = []
    flags: list[str] = []
    reasons: list[str] = []
    factor_levels: list[str] = []

    # Map input factors by key
    factor_map: dict[str, FactorInput] = {f.key: f for f in risk_input.factors}
    required_keys = ("wave_height_m", "wind_speed_kmh")

    # Evaluate factors
    wave_height_val: float | None = None
    wave_period_val: float | None = None
    wave_age_hours: float | None = None

    for f in risk_input.factors:
        age_h = f.get_effective_age_hours()
        lvl, caution_at, unsafe_at = evaluate_factor_level(f.key, f.value, age_h, vessel_class)
        factor_levels.append(lvl)

        age_mins = int(age_h * 60) if age_h is not None else None
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

        if f.key == "wave_height_m" and lvl != "unknown":
            wave_height_val = f.value
            wave_age_hours = age_h
        elif f.key == "wave_period_s" and lvl != "unknown":
            wave_period_val = f.value

        if lvl == "unknown":
            reason = "missing" if f.value is None else "stale"
            missing.append(f"{f.key}_{reason}")
            missing_or_stale.append(f"{f.label} ({reason})")
        elif lvl == "unsafe":
            reasons.append(f"{f.key.upper()}_UNSAFE")
        elif lvl == "caution":
            reasons.append(f"{f.key.upper()}_CAUTION")

    # Wave steepness evaluation
    if wave_height_val is not None and wave_period_val is not None:
        steepness = compute_wave_steepness(wave_height_val, wave_period_val)
        if steepness is not None:
            s_lvl, s_caut, s_unsf = evaluate_factor_level("wave_steepness", steepness, wave_age_hours, vessel_class)
            factor_levels.append(s_lvl)
            factor_outputs.append(
                FactorOutput(
                    key="wave_steepness",
                    label="Wave Steepness Index (H/T²)",
                    value=round(steepness, 4),
                    unit="m/s²",
                    level=s_lvl,
                    caution_at=s_caut,
                    unsafe_at=s_unsf,
                    source="orca_derived",
                    observed_at=None,
                    data_age_minutes=int(wave_age_hours * 60) if wave_age_hours is not None else None,
                )
            )
            if s_lvl == "unsafe":
                reasons.append("WAVE_STEEPNESS_UNSAFE")
            elif s_lvl == "caution":
                reasons.append("WAVE_STEEPNESS_CAUTION")

    # Check required core factors
    for req in required_keys:
        if req not in factor_map:
            missing.append(f"{req}_missing")
            missing_or_stale.append(f"{req} (missing)")
            reasons.append(f"REQUIRED_FACTOR_MISSING_{req.upper()}")
            factor_levels.append("unknown")

    # Evaluate official advisories
    active_advisories_payload: list[dict[str, Any]] = []
    advisory_forced_unsafe = False
    advisory_forced_caution = False

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
            missing.append(f"advisory_{adv.id}_stale")
            missing_or_stale.append(f"{adv.id} (stale)")
            flags.append("advisory_unverified")

        # Advisory must be active in window and cover point
        if adv.covers_point and adv.active_in_window:
            if adv.severity in ("warning", "severe"):
                advisory_forced_unsafe = True
                reasons.append(f"ADVISORY_{adv.severity.upper()}_FORCE_UNSAFE")
            elif adv.severity == "watch":
                advisory_forced_caution = True
                reasons.append("ADVISORY_WATCH_FORCE_CAUTION")

    # Advisory feed health verification
    if not risk_input.advisory_feed_healthy:
        flags.append("advisory_unverified")

    # Overall level decision
    required_unknown = False
    for req in required_keys:
        f_in = factor_map.get(req)
        if f_in is None:
            required_unknown = True
            break
        age_h = f_in.get_effective_age_hours()
        lvl, _, _ = evaluate_factor_level(req, f_in.value, age_h, vessel_class)
        if lvl == "unknown":
            required_unknown = True
            break

    if advisory_forced_unsafe:
        overall_level = "unsafe"
    elif required_unknown:
        overall_level = "unknown"
        reasons.append("REQUIRED_DATA_UNAVAILABLE")
    elif "unsafe" in factor_levels:
        overall_level = "unsafe"
    elif advisory_forced_caution or ("caution" in factor_levels):
        overall_level = "caution"
    else:
        overall_level = "safe"

    # Confidence calculation
    if overall_level == "unknown":
        confidence = "low"
    elif "advisory_unverified" in flags:
        confidence = "medium"
    elif sum(1 for fo in factor_outputs if fo.level != "unknown") >= 4 and len(missing) == 0:
        confidence = "high"
    else:
        confidence = "medium"

    # Valid window timestamps
    valid_from = risk_input.window.valid_from if risk_input.window else None
    valid_to = risk_input.window.valid_to if risk_input.window else None

    unique_flags = list(dict.fromkeys(flags))

    return RiskResult(
        level=overall_level,
        confidence=confidence,
        factors=factor_outputs,
        advisories=active_advisories_payload,
        missing=missing,
        flags=unique_flags,
        reasons=reasons,
        rules_version=RULES_VERSION,
        valid_from=valid_from,
        valid_to=valid_to,
        missing_or_stale=missing_or_stale,
    )
