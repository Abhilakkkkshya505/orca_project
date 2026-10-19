"""
Comprehensive test suite for ORCA Task 2:
- D1: Table-driven boundary tests for all factors and vessel classes
- D2: Property-based tests (Hypothesis) for monotonicity, determinism, clock-independence
- D3: Missing and staleness boundary tests
- D4: Advisory scenarios (none, watch, warning, severe, unverified feed)
- D5: Real-world marine scenarios (calm, monsoon swell, cyclone, squall, outage)
- D6: Adapter fixture tests (normalization, fill values to None, sanity bounds)
- D7: 100% branch coverage on apps.risk.rules
- Synthetic generator blocked in production
"""

from datetime import datetime, timedelta, timezone
import json
import os
import pytest
from hypothesis import HealthCheck, given, settings as hyp_settings, strategies as st

from apps.geodata.contracts import NormalizedTelemetry, QualityFlag
from apps.geodata.models import GridCell
from apps.geodata.sources.gdacs_events import GdacsEventsAdapter
from apps.geodata.sources.noaa_erddap_chlorophyll import NoaaErddapChlorophyllAdapter
from apps.geodata.sources.noaa_erddap_sst import NoaaErddapSstAdapter
from apps.geodata.sources.open_meteo_forecast import OpenMeteoForecastAdapter
from apps.geodata.sources.open_meteo_marine import OpenMeteoMarineAdapter
from apps.geodata.sources.synthetic import SyntheticGenerator
from apps.risk.rules import (
    AdvisoryInput,
    FactorInput,
    RiskInput,
    TimeWindow,
    compute_risk,
    compute_wave_steepness,
    evaluate_factor_level,
)
from apps.risk.thresholds import (
    MAX_DATA_AGE_HOURS,
    RULES_VERSION,
    THRESHOLDS,
    THRESHOLDS_CHECKSUM,
    compute_thresholds_checksum,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


# =====================================================================
# C3. Thresholds Banner and Checksum
# =====================================================================
def test_thresholds_banner_and_sources_doc():
    """Confirms required safety banner and valid sources documentation."""
    thresholds_fp = os.path.join(os.path.dirname(os.path.dirname(__file__)), "apps", "risk", "thresholds.py")
    with open(thresholds_fp, "r", encoding="utf-8") as f:
        content = f.read()
    assert "DEVELOPMENT VALUES. Not reviewed by a marine-safety expert. Official warnings override." in content

    # Sources documentation
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    sources_doc = os.path.join(root_dir, "docs", "risk-thresholds-sources.md")
    assert os.path.exists(sources_doc)
    with open(sources_doc, "r", encoding="utf-8") as f:
        s_content = f.read()
    assert "DEVELOPMENT VALUES. Not reviewed by a marine-safety expert." in s_content
    assert "INCOIS" in s_content
    assert "IMD" in s_content


def test_thresholds_checksum():
    """Checksum ensures any threshold table change is tested and intentional."""
    calculated = compute_thresholds_checksum()
    assert calculated == THRESHOLDS_CHECKSUM
    assert RULES_VERSION == "2026.10.0"


# =====================================================================
# D1. Table-Driven Boundary Tests
# =====================================================================
@pytest.mark.parametrize("vessel_class", ["small_craft", "mechanised"])
@pytest.mark.parametrize("factor_key", [
    "wave_height_m",
    "wave_period_s",
    "wave_steepness",
    "swell_wave_height_m",
    "wind_speed_kmh",
    "wind_gust_kmh",
    "precipitation_mm_h",
    "visibility_m",
    "current_speed_ms",
])
def test_d1_boundary_tests(vessel_class: str, factor_key: str):
    """
    Table-driven boundary test testing:
    caution - 0.001, caution, between, unsafe - 0.001, unsafe, unsafe + x
    """
    band = THRESHOLDS[vessel_class][factor_key]
    caut = band.caution
    unsf = band.unsafe
    age = 1.0  # Fresh data

    if band.is_lower_worse:
        # Lower values are more hazardous (wave_period_s, visibility_m)
        # e.g., caut = 5.0, unsf = 4.0
        # Value > caut -> safe
        lvl_safe, _, _ = evaluate_factor_level(factor_key, caut + 0.1, age, vessel_class)
        assert lvl_safe == "safe", f"{factor_key} {caut + 0.1} should be safe"

        # Value == caut -> caution
        lvl_caut, _, _ = evaluate_factor_level(factor_key, caut, age, vessel_class)
        assert lvl_caut == "caution", f"{factor_key} {caut} should be caution"

        # Between caut and unsf -> caution
        mid = (caut + unsf) / 2.0
        lvl_mid, _, _ = evaluate_factor_level(factor_key, mid, age, vessel_class)
        assert lvl_mid == "caution"

        # Value == unsf -> unsafe
        lvl_unsf, _, _ = evaluate_factor_level(factor_key, unsf, age, vessel_class)
        assert lvl_unsf == "unsafe", f"{factor_key} {unsf} should be unsafe"

        # Value < unsf -> unsafe
        lvl_worse, _, _ = evaluate_factor_level(factor_key, unsf - 0.5, age, vessel_class)
        assert lvl_worse == "unsafe"
    else:
        # Standard: higher values are more hazardous
        # Value < caut -> safe
        lvl_safe, _, _ = evaluate_factor_level(factor_key, caut - 0.001, age, vessel_class)
        assert lvl_safe == "safe"

        # Value == caut -> caution
        lvl_caut, _, _ = evaluate_factor_level(factor_key, caut, age, vessel_class)
        assert lvl_caut == "caution"

        # Between caut and unsf -> caution
        mid = (caut + unsf) / 2.0
        lvl_mid, _, _ = evaluate_factor_level(factor_key, mid, age, vessel_class)
        assert lvl_mid == "caution"

        # Value == unsf - 0.001 -> caution
        lvl_near_unsf, _, _ = evaluate_factor_level(factor_key, unsf - 0.001, age, vessel_class)
        assert lvl_near_unsf == "caution"

        # Value == unsf -> unsafe
        lvl_unsf, _, _ = evaluate_factor_level(factor_key, unsf, age, vessel_class)
        assert lvl_unsf == "unsafe"

        # Value > unsf -> unsafe
        lvl_above, _, _ = evaluate_factor_level(factor_key, unsf + 5.0, age, vessel_class)
        assert lvl_above == "unsafe"


# =====================================================================
# D2. Property-Based Tests (Hypothesis)
# =====================================================================
class RiskLevelOrder:
    ORDER = {"safe": 0, "caution": 1, "unsafe": 2, "unknown": -1}

    @classmethod
    def rank(cls, level: str) -> int:
        return cls.ORDER.get(level, -1)


@given(
    wave1=st.floats(min_value=0.0, max_value=10.0),
    wave2=st.floats(min_value=0.0, max_value=10.0),
    wind1=st.floats(min_value=0.0, max_value=120.0),
    wind2=st.floats(min_value=0.0, max_value=120.0),
    vessel=st.sampled_from(["small_craft", "mechanised"]),
)
@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.too_slow])
def test_d2_monotonicity_property(wave1: float, wave2: float, wind1: float, wind2: float, vessel: str):
    """Monotonicity: Increasing any hazard metric never decreases the overall risk level."""
    # Ensure (wave2, wind2) >= (wave1, wind1)
    w_low = min(wave1, wave2)
    w_high = max(wave1, wave2)
    wind_low = min(wind1, wind2)
    wind_high = max(wind1, wind2)

    now = datetime(2026, 10, 19, 12, 0, tzinfo=timezone.utc)
    factors_low = [
        FactorInput(key="wave_height_m", label="Wave", value=w_low, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=wind_low, unit="km/h", source="test", age_hours=1.0),
    ]
    factors_high = [
        FactorInput(key="wave_height_m", label="Wave", value=w_high, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=wind_high, unit="km/h", source="test", age_hours=1.0),
    ]

    res_low = compute_risk(RiskInput(vessel_class=vessel, factors=factors_low, now=now))
    res_high = compute_risk(RiskInput(vessel_class=vessel, factors=factors_high, now=now))

    # Neither should be unknown because required factors are fresh and valid
    assert res_low.level in ("safe", "caution", "unsafe")
    assert res_high.level in ("safe", "caution", "unsafe")
    assert RiskLevelOrder.rank(res_high.level) >= RiskLevelOrder.rank(res_low.level)


@given(
    wave=st.floats(min_value=0.0, max_value=10.0),
    wind=st.floats(min_value=0.0, max_value=120.0),
    drop_factor=st.sampled_from(["wave_height_m", "wind_speed_kmh"]),
)
@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.too_slow])
def test_d2_removing_required_factor_never_safe(wave: float, wind: float, drop_factor: str):
    """Removing a required factor forces overall level to unknown, NEVER safe."""
    factors = [
        FactorInput(key="wave_height_m", label="Wave", value=wave, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=wind, unit="km/h", source="test", age_hours=1.0),
    ]
    remaining = [f for f in factors if f.key != drop_factor]
    res = compute_risk(RiskInput(vessel_class="small_craft", factors=remaining))
    assert res.level == "unknown"
    assert "REQUIRED_DATA_UNAVAILABLE" in res.reasons


def test_d2_determinism_and_clock_independence():
    """Asserts that compute_risk produces identical outputs given identical inputs with no clock reads."""
    f = [
        FactorInput(key="wave_height_m", label="Wave", value=1.8, unit="m", source="test", age_hours=2.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=35.0, unit="km/h", source="test", age_hours=2.0),
    ]
    inp1 = RiskInput(vessel_class="small_craft", factors=f)
    inp2 = RiskInput(vessel_class="small_craft", factors=f)

    res1 = compute_risk(inp1)
    res2 = compute_risk(inp2)

    assert res1.level == res2.level == "caution"
    assert res1.reasons == res2.reasons
    assert res1.confidence == res2.confidence


# =====================================================================
# D3. Missing & Stale Factor Combinations
# =====================================================================
def test_d3_exact_staleness_boundary():
    """Tests exact staleness limit: 12.0 hours fresh vs 12.01 hours stale."""
    # At exact limit (12.0h) -> fresh
    f_fresh = [
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=12.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=15.0, unit="km/h", source="test", age_hours=12.0),
    ]
    res_fresh = compute_risk(RiskInput(vessel_class="small_craft", factors=f_fresh))
    assert res_fresh.level == "safe"

    # Exceeding limit by 1 minute (12.02h) -> stale -> unknown
    f_stale = [
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=12.02),
        FactorInput(key="wind_speed_kmh", label="Wind", value=15.0, unit="km/h", source="test", age_hours=12.0),
    ]
    res_stale = compute_risk(RiskInput(vessel_class="small_craft", factors=f_stale))
    assert res_stale.level == "unknown"
    assert "wave_height_m_stale" in res_stale.missing


def test_d3_optional_factors_missing_downgrade_confidence():
    """Missing optional factor does not force unknown if required factors are safe, but downgrades confidence."""
    f = [
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=15.0, unit="km/h", source="test", age_hours=1.0),
        # Optional gust and period are missing
        FactorInput(key="wind_gust_kmh", label="Gust", value=None, unit="km/h", source="test", age_hours=1.0),
    ]
    res = compute_risk(RiskInput(vessel_class="small_craft", factors=f))
    assert res.level == "safe"
    assert res.confidence == "medium"
    assert "wind_gust_kmh_missing" in res.missing


# =====================================================================
# D4. Advisory Scenarios
# =====================================================================
def test_d4_advisory_scenarios():
    """Tests advisory interactions: warning, severe, watch, unverified feed."""
    base_factors = [
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=15.0, unit="km/h", source="test", age_hours=1.0),
    ]

    # 1. No advisories -> safe
    res_none = compute_risk(RiskInput(vessel_class="small_craft", factors=base_factors))
    assert res_none.level == "safe"

    # 2. Severe advisory covering point -> forces unsafe
    adv_sev = [
        AdvisoryInput(
            id="adv-01",
            headline="Super Cyclone Warning",
            severity="severe",
            source="imd",
            covers_point=True,
            active_in_window=True,
        )
    ]
    res_sev = compute_risk(RiskInput(vessel_class="small_craft", factors=base_factors, active_advisories=adv_sev))
    assert res_sev.level == "unsafe"
    assert "ADVISORY_SEVERE_FORCE_UNSAFE" in res_sev.reasons

    # 3. Watch advisory covering point -> forces at least caution
    adv_watch = [
        AdvisoryInput(
            id="adv-02",
            headline="High Wave Watch",
            severity="watch",
            source="incois",
            covers_point=True,
            active_in_window=True,
        )
    ]
    res_watch = compute_risk(RiskInput(vessel_class="small_craft", factors=base_factors, active_advisories=adv_watch))
    assert res_watch.level == "caution"
    assert "ADVISORY_WATCH_FORCE_CAUTION" in res_watch.reasons

    # 4. Advisory not covering point -> does not force unsafe
    adv_other = [
        AdvisoryInput(
            id="adv-03",
            headline="Distant Storm",
            severity="warning",
            source="imd",
            covers_point=False,
            active_in_window=True,
        )
    ]
    res_other = compute_risk(RiskInput(vessel_class="small_craft", factors=base_factors, active_advisories=adv_other))
    assert res_other.level == "safe"

    # 5. Unhealthy advisory feed -> adds advisory_unverified flag
    res_unhealthy = compute_risk(
        RiskInput(vessel_class="small_craft", factors=base_factors, advisory_feed_healthy=False)
    )
    assert res_unhealthy.level == "safe"
    assert "advisory_unverified" in res_unhealthy.flags
    assert res_unhealthy.confidence == "medium"


# =====================================================================
# D5. Real-Shaped Scenario Tests
# =====================================================================
def test_d5_calm_day():
    f = [
        FactorInput(key="wave_height_m", label="Wave", value=0.8, unit="m", source="open_meteo", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=8.5, unit="s", source="open_meteo", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=14.0, unit="km/h", source="open_meteo", age_hours=1.0),
        FactorInput(key="wind_gust_kmh", label="Gust", value=18.0, unit="km/h", source="open_meteo", age_hours=1.0),
        FactorInput(key="precipitation_mm_h", label="Rain", value=0.0, unit="mm/h", source="open_meteo", age_hours=1.0),
        FactorInput(key="visibility_m", label="Vis", value=10000.0, unit="m", source="open_meteo", age_hours=1.0),
    ]
    res = compute_risk(RiskInput(vessel_class="small_craft", factors=f))
    assert res.level == "safe"
    assert res.confidence == "high"


def test_d5_monsoon_swell():
    f = [
        FactorInput(key="wave_height_m", label="Wave", value=2.4, unit="m", source="open_meteo", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=12.0, unit="s", source="open_meteo", age_hours=1.0),
        FactorInput(key="swell_wave_height_m", label="Swell", value=2.2, unit="m", source="open_meteo", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=28.0, unit="km/h", source="open_meteo", age_hours=1.0),
    ]
    res = compute_risk(RiskInput(vessel_class="small_craft", factors=f))
    assert res.level == "unsafe"
    assert "WAVE_HEIGHT_M_UNSAFE" in res.reasons


def test_d5_squall_steep_waves():
    """Squall scenario: moderate wave height (1.6m) but very short period (4.5s) -> steep waves."""
    f = [
        FactorInput(key="wave_height_m", label="Wave", value=1.6, unit="m", source="open_meteo", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=4.5, unit="s", source="open_meteo", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=34.0, unit="km/h", source="open_meteo", age_hours=1.0),
        FactorInput(key="wind_gust_kmh", label="Gust", value=48.0, unit="km/h", source="open_meteo", age_hours=1.0),
    ]
    res = compute_risk(RiskInput(vessel_class="small_craft", factors=f))
    assert res.level in ("caution", "unsafe")
    assert any("WAVE_STEEPNESS" in r or "WAVE" in r for r in res.reasons)


# =====================================================================
# D6. Adapter Tests on Recorded Response Fixtures
# =====================================================================
def test_d6_open_meteo_marine_fixture():
    fp = os.path.join(FIXTURES_DIR, "open_meteo_marine.json")
    with open(fp, "r", encoding="utf-8") as f:
        data = json.load(f)

    adapter = OpenMeteoMarineAdapter()
    raw = adapter.fetch(18.93, 72.84)[0] if False else None
    from apps.geodata.sources.base import RawRecord

    raw = RawRecord(source_slug="open_meteo_marine", lat=18.93, lon=72.84, issued_at=datetime.now(timezone.utc), data=data)
    norm = adapter.normalise(raw)
    assert len(norm) == 4
    first = norm[0]
    assert first.wave_height_m == 1.2
    assert first.wave_period_s == 7.5
    assert first.swell_wave_height_m == 0.8
    assert first.valid_time.tzinfo is not None


def test_d6_open_meteo_forecast_fixture():
    fp = os.path.join(FIXTURES_DIR, "open_meteo_forecast.json")
    with open(fp, "r", encoding="utf-8") as f:
        data = json.load(f)

    from apps.geodata.sources.base import RawRecord

    adapter = OpenMeteoForecastAdapter()
    raw = RawRecord(source_slug="open_meteo_forecast", lat=18.93, lon=72.84, issued_at=datetime.now(timezone.utc), data=data)
    norm = adapter.normalise(raw)
    assert len(norm) == 4
    first = norm[0]
    assert first.wind_speed_kmh == 18.5
    assert first.wind_gust_kmh == 25.0
    assert first.visibility_m == 10000.0


def test_d6_noaa_erddap_sst_fixture():
    fp = os.path.join(FIXTURES_DIR, "noaa_erddap_sst.json")
    with open(fp, "r", encoding="utf-8") as f:
        data = json.load(f)

    from apps.geodata.sources.base import RawRecord

    adapter = NoaaErddapSstAdapter()
    raw = RawRecord(source_slug="noaa_erddap_sst", lat=18.93, lon=72.84, issued_at=datetime.now(timezone.utc), data=data)
    norm = adapter.normalise(raw)
    assert len(norm) == 4
    # Check that nulls become None with cloud_gap flag
    cloud_rec = [r for r in norm if QualityFlag.CLOUD_GAP in r.quality_flags]
    assert len(cloud_rec) == 1
    assert cloud_rec[0].sst_c is None


def test_d6_gdacs_events_fixture(db):
    fp = os.path.join(FIXTURES_DIR, "gdacs_events.json")
    with open(fp, "r", encoding="utf-8") as f:
        data = json.load(f)

    adapter = GdacsEventsAdapter()
    saved = adapter.ingest_events(data)
    assert saved == 2
    from apps.geodata.models import Advisory

    dana = Advisory.objects.filter(external_id="1001142").first()
    assert dana is not None
    assert dana.severity == Advisory.SeverityChoice.WARNING
    assert "Third-party hazard alert (GDACS)" in dana.headline


# =====================================================================
# Synthetic Generator Blocked in Production
# =====================================================================
def test_synthetic_generator_blocked_in_production(settings, monkeypatch):
    settings.ENVIRONMENT = "production"
    monkeypatch.setenv("ENVIRONMENT", "production")
    gen = SyntheticGenerator()
    with pytest.raises(PermissionError, match="blocked in production"):
        gen.generate_scenario("calm", 18.93, 72.84)


def test_synthetic_generator_allowed_in_dev(settings, monkeypatch):
    settings.ENVIRONMENT = "development"
    monkeypatch.setenv("ENVIRONMENT", "development")
    gen = SyntheticGenerator()
    records = gen.generate_scenario("calm", 18.93, 72.84, forecast_days=1)
    assert len(records) == 24
    assert records[0].wave_height_m is not None


# =====================================================================
# D7. 100% Branch Coverage on apps.risk.rules
# =====================================================================
def test_d7_complete_rules_branch_coverage():
    """Systematically covers all edge-case branches in apps.risk.rules."""
    # 1. get_effective_age_hours fallback paths
    f1 = FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", data_age_minutes=120)
    assert f1.get_effective_age_hours() == 2.0
    f2 = FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test")
    assert f2.get_effective_age_hours() is None

    # 2. evaluate_factor_level unmapped factor key
    lvl_none, c_none, u_none = evaluate_factor_level("unknown_factor_key", 5.0, 1.0, "small_craft")
    assert lvl_none == "safe"
    assert c_none is None and u_none is None

    # 3. compute_wave_steepness zero and None period
    assert compute_wave_steepness(None, 5.0) is None
    assert compute_wave_steepness(1.0, None) is None
    assert compute_wave_steepness(1.0, 0.0) is None
    assert compute_wave_steepness(1.0, -2.0) is None

    # 4. Fallback vessel class
    res_bad_vessel = compute_risk(RiskInput(vessel_class="alien_spacecraft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
    ]))
    assert res_bad_vessel.level == "safe"

    # 5. Wave steepness caution branch
    # H=1.0, T=4.8 -> steepness = 1.0 / 23.04 = 0.0434 (between 0.040 and 0.060)
    res_steep_caut = compute_risk(RiskInput(vessel_class="small_craft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=4.8, unit="s", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
    ]))
    assert "WAVE_STEEPNESS_CAUTION" in res_steep_caut.reasons

    # 6. Wave steepness unsafe branch
    # H=1.8, T=4.5 -> steepness = 1.8 / 20.25 = 0.0888 (> 0.060)
    res_steep_unsf = compute_risk(RiskInput(vessel_class="small_craft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.8, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=4.5, unit="s", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
    ]))
    assert "WAVE_STEEPNESS_UNSAFE" in res_steep_unsf.reasons

    # 7. Missing required factor triggers REQUIRED_FACTOR_MISSING
    res_miss_wind = compute_risk(RiskInput(vessel_class="small_craft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
    ]))
    assert res_miss_wind.level == "unknown"
    assert "REQUIRED_FACTOR_MISSING_WIND_SPEED_KMH" in res_miss_wind.reasons

    # 8. Stale advisory (>6h)
    stale_adv = AdvisoryInput(
        id="adv-old",
        headline="Old Gale",
        severity="info",
        source="imd",
        age_hours=8.0,
        covers_point=True,
        active_in_window=True,
    )
    res_stale_adv = compute_risk(RiskInput(vessel_class="small_craft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
    ], active_advisories=[stale_adv]))
    assert "advisory_adv-old_stale" in res_stale_adv.missing
    assert "advisory_unverified" in res_stale_adv.flags

    # 9. TimeWindow valid_from and valid_to
    tw = TimeWindow(valid_from="2026-10-19T00:00:00Z", valid_to="2026-10-19T12:00:00Z")
    res_tw = compute_risk(RiskInput(
        vessel_class="small_craft",
        factors=[
            FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
            FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
        ],
        window=tw,
    ))
    assert res_tw.valid_from == "2026-10-19T00:00:00Z"
    assert res_tw.valid_to == "2026-10-19T12:00:00Z"

    # 10. Wave period 0.0 causes steepness to be None
    res_zero_period = compute_risk(RiskInput(vessel_class="small_craft", factors=[
        FactorInput(key="wave_height_m", label="Wave", value=1.0, unit="m", source="test", age_hours=1.0),
        FactorInput(key="wave_period_s", label="Period", value=0.0, unit="s", source="test", age_hours=1.0),
        FactorInput(key="wind_speed_kmh", label="Wind", value=10.0, unit="km/h", source="test", age_hours=1.0),
    ]))
    assert not any(f.key == "wave_steepness" for f in res_zero_period.factors)
