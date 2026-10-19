# ==============================================================================
# DEVELOPMENT VALUES. Not reviewed by a marine-safety expert. Official warnings override.
# ==============================================================================
"""
Threshold definitions and safety bands for the ORCA risk rules engine.
All thresholds are documented with peer-reviewed or regulatory sources in:
docs/risk-thresholds-sources.md

RULES_VERSION: 2026.10.0
"""

from dataclasses import dataclass
import hashlib
import json

RULES_VERSION = "2026.10.0"


@dataclass(frozen=True)
class Band:
    caution: float
    unsafe: float
    is_lower_worse: bool = False  # True for wave_period_s and visibility_m


# Threshold bands per vessel class
THRESHOLDS: dict[str, dict[str, Band]] = {
    "small_craft": {
        # Traditional artisanal craft, FRP boats, open motorised skiffs (<12m)
        "wave_height_m": Band(caution=1.5, unsafe=2.2),
        "wave_period_s": Band(caution=5.0, unsafe=4.0, is_lower_worse=True),
        "wave_steepness": Band(caution=0.040, unsafe=0.060),
        "swell_wave_height_m": Band(caution=1.2, unsafe=2.0),
        "wind_speed_kmh": Band(caution=30.0, unsafe=45.0),
        "wind_gust_kmh": Band(caution=40.0, unsafe=55.0),
        "precipitation_mm_h": Band(caution=10.0, unsafe=30.0),
        "visibility_m": Band(caution=2000.0, unsafe=1000.0, is_lower_worse=True),
        "current_speed_ms": Band(caution=1.5, unsafe=2.5),
    },
    "mechanised": {
        # Inboard engine trawlers, gillnetters, purse seiners (>15m)
        "wave_height_m": Band(caution=2.5, unsafe=3.8),
        "wave_period_s": Band(caution=4.5, unsafe=3.5, is_lower_worse=True),
        "wave_steepness": Band(caution=0.050, unsafe=0.075),
        "swell_wave_height_m": Band(caution=2.0, unsafe=3.2),
        "wind_speed_kmh": Band(caution=45.0, unsafe=65.0),
        "wind_gust_kmh": Band(caution=60.0, unsafe=80.0),
        "precipitation_mm_h": Band(caution=20.0, unsafe=50.0),
        "visibility_m": Band(caution=1500.0, unsafe=500.0, is_lower_worse=True),
        "current_speed_ms": Band(caution=2.0, unsafe=3.5),
    },
}

# Maximum allowed data age in hours before data is considered stale
MAX_DATA_AGE_HOURS: dict[str, float] = {
    "wave_height_m": 12.0,
    "wave_period_s": 12.0,
    "wave_steepness": 12.0,
    "swell_wave_height_m": 12.0,
    "wind_speed_kmh": 12.0,
    "wind_gust_kmh": 12.0,
    "precipitation_mm_h": 12.0,
    "visibility_m": 12.0,
    "current_speed_ms": 12.0,
    "advisories": 6.0,
}


def compute_thresholds_checksum() -> str:
    """Generates a stable SHA-256 checksum over the threshold definition tables."""
    serialized = {}
    for vessel, factors in sorted(THRESHOLDS.items()):
        serialized[vessel] = {
            f: {"caution": b.caution, "unsafe": b.unsafe, "lower_worse": b.is_lower_worse}
            for f, b in sorted(factors.items())
        }
    serialized["_version"] = RULES_VERSION
    payload = json.dumps(serialized, sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


THRESHOLDS_CHECKSUM = compute_thresholds_checksum()
