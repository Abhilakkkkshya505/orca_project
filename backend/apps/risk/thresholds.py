"""
Development placeholder thresholds for the ORCA risk rules engine.

IMPORTANT SAFETY NOTICE:
The threshold numbers in this file are development placeholders. They must be reviewed
and replaced by values from a qualified marine-safety authority (INCOIS, IMD, State Fisheries
Department, or Indian Coast Guard) before any operational or real-world use at sea.
Do not present these placeholder numbers as official safety guidance.
"""

from dataclasses import dataclass

RULES_VERSION = "2026.10.0"


@dataclass(frozen=True)
class Band:
    caution: float
    unsafe: float


# Threshold bands per vessel class (development placeholders)
THRESHOLDS: dict[str, dict[str, Band]] = {
    "small_craft": {
        # Traditional artisanal craft, FRP boats, open canoes
        "wave_height_m": Band(caution=1.5, unsafe=2.2),
        "wave_period_s": Band(caution=5.0, unsafe=4.0),  # short steep choppy waves
        "wind_speed_kmh": Band(caution=30.0, unsafe=45.0),
        "wind_gust_kmh": Band(caution=40.0, unsafe=55.0),
        "rain_mm": Band(caution=10.0, unsafe=30.0),
    },
    "mechanised": {
        # Inboard engine trawlers, gillnetters, larger coastal vessels
        "wave_height_m": Band(caution=2.5, unsafe=3.8),
        "wave_period_s": Band(caution=4.5, unsafe=3.5),
        "wind_speed_kmh": Band(caution=45.0, unsafe=65.0),
        "wind_gust_kmh": Band(caution=60.0, unsafe=80.0),
        "rain_mm": Band(caution=20.0, unsafe=50.0),
    },
}

# Maximum allowed data age in hours before data is considered stale
MAX_DATA_AGE_HOURS: dict[str, float] = {
    "wave_height_m": 12.0,
    "wave_period_s": 12.0,
    "wind_speed_kmh": 12.0,
    "wind_gust_kmh": 12.0,
    "rain_mm": 12.0,
    "advisories": 6.0,
}
