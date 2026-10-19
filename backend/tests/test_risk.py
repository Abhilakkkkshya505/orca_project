"""Comprehensive tests for the deterministic risk rules engine.

Targets 100% branch and boundary coverage for apps.risk.rules.
Verifies all non-negotiable safety rules:
1. Risk level decided ONLY by deterministic pure functions.
2. Missing or stale data MUST produce 'unknown', never 'safe'.
3. Active 'warning' or 'severe' official advisory FORCES 'unsafe'.
4. Exact boundary threshold checks (safe, caution, unsafe).
"""

from apps.risk.rules import (
    AdvisoryInput,
    FactorInput,
    RiskInput,
    compute_risk,
    evaluate_factor_level,
)
from apps.risk.thresholds import RULES_VERSION


def test_evaluate_factor_level_missing_and_stale():
    """Missing value, missing age, or stale age returns 'unknown'."""
    # Value is None
    lvl, c, u = evaluate_factor_level("wave_height_m", None, 1.0, "small_craft")
    assert lvl == "unknown"
    assert c == 1.5
    assert u == 2.2

    # Age is None
    lvl, c, u = evaluate_factor_level("wave_height_m", 1.0, None, "small_craft")
    assert lvl == "unknown"

    # Stale data (> 12 hours)
    lvl, c, u = evaluate_factor_level("wave_height_m", 1.0, 12.1, "small_craft")
    assert lvl == "unknown"

    # Factor with no threshold band defined
    lvl, c, u = evaluate_factor_level("water_temp_c", 28.5, 2.0, "small_craft")
    assert lvl == "safe"
    assert c is None
    assert u is None


def test_evaluate_factor_level_wave_period_boundaries():
    """Wave period: lower values mean steeper and more dangerous waves."""
    # Unsafe boundary: <= 4.0
    lvl, c, u = evaluate_factor_level("wave_period_s", 3.8, 1.0, "small_craft")
    assert lvl == "unsafe"
    lvl, _, _ = evaluate_factor_level("wave_period_s", 4.0, 1.0, "small_craft")
    assert lvl == "unsafe"

    # Caution boundary: 4.1 to 5.0
    lvl, _, _ = evaluate_factor_level("wave_period_s", 4.5, 1.0, "small_craft")
    assert lvl == "caution"
    lvl, _, _ = evaluate_factor_level("wave_period_s", 5.0, 1.0, "small_craft")
    assert lvl == "caution"

    # Safe: > 5.0
    lvl, _, _ = evaluate_factor_level("wave_period_s", 5.1, 1.0, "small_craft")
    assert lvl == "safe"
    lvl, _, _ = evaluate_factor_level("wave_period_s", 9.0, 1.0, "small_craft")
    assert lvl == "safe"


def test_evaluate_factor_level_higher_is_worse_boundaries():
    """For wave height and wind: higher values mean more dangerous."""
    # Safe: < 1.5
    lvl, _, _ = evaluate_factor_level("wave_height_m", 1.49, 1.0, "small_craft")
    assert lvl == "safe"

    # Caution boundary: >= 1.5 and < 2.2
    lvl, _, _ = evaluate_factor_level("wave_height_m", 1.5, 1.0, "small_craft")
    assert lvl == "caution"
    lvl, _, _ = evaluate_factor_level("wave_height_m", 2.19, 1.0, "small_craft")
    assert lvl == "caution"

    # Unsafe boundary: >= 2.2
    lvl, _, _ = evaluate_factor_level("wave_height_m", 2.2, 1.0, "small_craft")
    assert lvl == "unsafe"
    lvl, _, _ = evaluate_factor_level("wave_height_m", 3.5, 1.0, "small_craft")
    assert lvl == "unsafe"


def test_mechanised_vessel_class_thresholds():
    """Mechanised vessel class has higher threshold bands than small craft."""
    # Wave height 2.0m: caution for small_craft, but safe for mechanised (band: 2.5 - 3.8)
    lvl_small, _, _ = evaluate_factor_level("wave_height_m", 2.0, 1.0, "small_craft")
    lvl_mech, _, _ = evaluate_factor_level("wave_height_m", 2.0, 1.0, "mechanised")
    assert lvl_small == "caution"
    assert lvl_mech == "safe"

    # Wave height 3.0m: unsafe for small_craft, caution for mechanised
    lvl_small, _, _ = evaluate_factor_level("wave_height_m", 3.0, 1.0, "small_craft")
    lvl_mech, _, _ = evaluate_factor_level("wave_height_m", 3.0, 1.0, "mechanised")
    assert lvl_small == "unsafe"
    assert lvl_mech == "caution"

    # Wave height 4.0m: unsafe for both
    lvl_mech, _, _ = evaluate_factor_level("wave_height_m", 4.0, 1.0, "mechanised")
    assert lvl_mech == "unsafe"


def _make_base_factors(wave=1.0, wind=15.0, gust=20.0, period=8.0, rain=0.0, age=1.0) -> list[FactorInput]:
    return [
        FactorInput("wave_height_m", "Significant Wave Height", wave, "m", "open_meteo", "2026-10-18T10:00:00Z", age),
        FactorInput("wave_period_s", "Wave Period", period, "s", "open_meteo", "2026-10-18T10:00:00Z", age),
        FactorInput("wind_speed_kmh", "Sustained Wind Speed", wind, "km/h", "open_meteo", "2026-10-18T10:00:00Z", age),
        FactorInput("wind_gust_kmh", "Maximum Wind Gusts", gust, "km/h", "open_meteo", "2026-10-18T10:00:00Z", age),
        FactorInput("rain_mm", "Precipitation", rain, "mm", "open_meteo", "2026-10-18T10:00:00Z", age),
    ]


def test_compute_risk_all_safe():
    """All factors safe, no active advisories -> overall safe."""
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=_make_base_factors(),
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "safe"
    assert len(result.missing_or_stale) == 0
    assert result.rules_version == RULES_VERSION
    assert "Official warnings override ORCA" in result.disclaimer


def test_compute_risk_caution_when_one_factor_is_caution():
    """One factor caution, rest safe -> overall caution."""
    factors = _make_base_factors(wave=1.8)  # Wave caution is 1.5 - 2.2
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "caution"


def test_compute_risk_unsafe_when_one_factor_is_unsafe():
    """One factor unsafe -> overall unsafe."""
    factors = _make_base_factors(wind=50.0)  # Wind unsafe is >= 45
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "unsafe"


def test_compute_risk_missing_required_factor_gives_unknown():
    """Non-negotiable rule: Missing or stale required data produces 'unknown', NEVER 'safe'."""
    # Omit wave_height_m entirely
    factors = [
        FactorInput("wind_speed_kmh", "Sustained Wind Speed", 10.0, "km/h", "open_meteo", "2026-10-18T10:00:00Z", 1.0),
    ]
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "unknown"
    assert any("wave_height_m" in s for s in result.missing_or_stale)


def test_compute_risk_stale_data_gives_unknown():
    """Stale data produces 'unknown', never 'safe'."""
    factors = _make_base_factors(age=14.0)  # max age is 12.0
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "unknown"
    assert len(result.missing_or_stale) > 0


def test_compute_risk_none_value_gives_unknown():
    """None value in factor produces 'unknown'."""
    factors = _make_base_factors()
    factors[0] = FactorInput("wave_height_m", "Significant Wave Height", None, "m", "open_meteo", None, None)
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "unknown"
    assert any("Significant Wave Height (missing)" in s for s in result.missing_or_stale)


def test_compute_risk_active_warning_forces_unsafe():
    """Non-negotiable rule: Any active warning or severe advisory covering the point forces 'unsafe'."""
    # Perfectly calm weather
    factors = _make_base_factors(wave=0.5, wind=8.0)
    advisories = [
        AdvisoryInput(
            id="INCOIS-WARN-01",
            headline="Rough Sea Alert",
            severity="warning",
            source="incois",
            age_hours=1.0,
        )
    ]
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=advisories,
    )
    result = compute_risk(risk_in)
    assert result.level == "unsafe"
    assert len(result.advisories) == 1
    assert result.advisories[0]["id"] == "INCOIS-WARN-01"


def test_compute_risk_active_watch_does_not_force_unsafe():
    """Watch advisory adds context but does not force unsafe if weather is safe."""
    factors = _make_base_factors(wave=0.5, wind=8.0)
    advisories = [
        AdvisoryInput(
            id="INCOIS-WATCH-01",
            headline="High Swell Watch",
            severity="watch",
            source="incois",
            age_hours=2.0,
        )
    ]
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=advisories,
    )
    result = compute_risk(risk_in)
    assert result.level == "caution"  # Task 2: watch forces at least caution (does not force unsafe)


def test_compute_risk_stale_advisory_flagged():
    """Advisory older than 6 hours is flagged in missing_or_stale."""
    factors = _make_base_factors()
    advisories = [
        AdvisoryInput(
            id="OLD-ADV-01",
            headline="Old Bulletin",
            severity="watch",
            source="incois",
            age_hours=7.5,
        )
    ]
    risk_in = RiskInput(
        vessel_class="small_craft",
        factors=factors,
        active_advisories=advisories,
    )
    result = compute_risk(risk_in)
    assert any("OLD-ADV-01 (stale)" in s for s in result.missing_or_stale)


def test_compute_risk_unknown_vessel_class_fallback():
    """Unrecognized vessel class falls back safely to 'small_craft'."""
    factors = _make_base_factors(wave=1.8)  # 1.8 is caution for small_craft
    risk_in = RiskInput(
        vessel_class="space_shuttle",
        factors=factors,
        active_advisories=[],
    )
    result = compute_risk(risk_in)
    assert result.level == "caution"
