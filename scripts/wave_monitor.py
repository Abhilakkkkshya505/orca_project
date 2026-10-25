#!/usr/bin/env python3
"""
ORCA Open-Meteo High-Resolution Wave & Swell Monitor.
Utilizes openmeteo-requests, requests-cache, and retry-requests with FlatBuffer binary transport.

Usage:
    python scripts/wave_monitor.py --lat 9.9667 --lon 76.2333 --days 3
    python scripts/wave_monitor.py --port kochi-cochin-in
"""

import argparse
import sys
from pathlib import Path

# Force UTF-8 encoding on standard output for Windows cmd/powershell
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import pandas as pd
import requests_cache
from retry_requests import retry
import openmeteo_requests

# Douglas Sea Scale mapping based on wave height (meters)
def douglas_sea_scale(hs: float) -> tuple[int, str]:
    if hs < 0.1:
        return 0, "Calm (glassy)"
    elif hs < 0.5:
        return 1, "Calm (rippled)"
    elif hs < 1.25:
        return 2, "Smooth (wavelets)"
    elif hs < 2.5:
        return 3, "Slight"
    elif hs < 4.0:
        return 4, "Moderate"
    elif hs < 6.0:
        return 5, "Rough"
    elif hs < 9.0:
        return 6, "Very rough"
    elif hs < 14.0:
        return 7, "High"
    else:
        return 8, "Very high / Phenomenal"


def get_wave_telemetry(lat: float, lon: float, forecast_days: int = 3, cache_dir: str = ".cache") -> pd.DataFrame:
    """Fetches high-resolution hourly marine wave and sea-level telemetry from Open-Meteo."""
    Path(cache_dir).mkdir(exist_ok=True)
    cache_path = str(Path(cache_dir) / "openmeteo_marine_cache")
    cache_session = requests_cache.CachedSession(cache_path, expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    client = openmeteo_requests.Client(session=retry_session)

    url = "https://marine-api.open-meteo.com/v1/marine"
    variables = [
        "wave_height",
        "wave_direction",
        "wind_wave_height",
        "wind_wave_direction",
        "wind_wave_period",
        "secondary_swell_wave_height",
        "sea_level_height_msl",
    ]

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": variables,
        "forecast_days": forecast_days,
    }

    responses = client.weather_api(url, params=params)
    response = responses[0]

    hourly = response.Hourly()
    time_series = pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left",
    )

    data = {
        "timestamp_utc": time_series,
        "wave_height_m": hourly.Variables(0).ValuesAsNumpy(),
        "wave_dir_deg": hourly.Variables(1).ValuesAsNumpy(),
        "wind_wave_m": hourly.Variables(2).ValuesAsNumpy(),
        "wind_wave_dir_deg": hourly.Variables(3).ValuesAsNumpy(),
        "wind_wave_period_s": hourly.Variables(4).ValuesAsNumpy(),
        "secondary_swell_m": hourly.Variables(5).ValuesAsNumpy(),
        "sea_level_msl_m": hourly.Variables(6).ValuesAsNumpy(),
    }

    df = pd.DataFrame(data=data)
    
    # Calculate Douglas scale & risk flags
    scales = [douglas_sea_scale(h) for h in df["wave_height_m"]]
    df["douglas_scale"] = [s[0] for s in scales]
    df["sea_condition"] = [s[1] for s in scales]
    
    # Cross-sea alert: significant primary and secondary swells simultaneously
    df["cross_sea_warning"] = (df["secondary_swell_m"] >= 1.0) & (df["wind_wave_m"] >= 1.0)
    
    return df, response.Latitude(), response.Longitude()


def main():
    parser = argparse.ArgumentParser(description="ORCA Open-Meteo Wave & Sea-State Telemetry Monitor")
    parser.add_argument("--lat", type=float, default=9.9667, help="Latitude (default: 9.9667 for Fort Kochi)")
    parser.add_argument("--lon", type=float, default=76.2333, help="Longitude (default: 76.2333 for Fort Kochi)")
    parser.add_argument("--days", type=int, default=3, help="Forecast days (1 to 7)")
    parser.add_argument("--csv", type=str, help="Optional output path to export CSV")
    args = parser.parse_args()

    print("=" * 70)
    print("🌊 ORCA OCEANOGRAPHIC TELEMETRY: OPEN-METEO WAVE MONITOR")
    print(f"Target Coordinates : {args.lat:.4f}°N, {args.lon:.4f}°E")
    print(f"Forecast Horizon   : {args.days} Days")
    print("=" * 70)

    try:
        df, sea_lat, sea_lon = get_wave_telemetry(args.lat, args.lon, args.days)
        print(f"Resolved Marine Grid Cell: {sea_lat:.4f}°N, {sea_lon:.4f}°E\n")

        # Summary Metrics
        max_wave = df["wave_height_m"].max()
        avg_wave = df["wave_height_m"].mean()
        max_swell2 = df["secondary_swell_m"].max()
        max_surge = df["sea_level_msl_m"].max()
        cross_seas = df["cross_sea_warning"].sum()

        print(f"Peak Significant Wave Height (Hs) : {max_wave:.2f} m")
        print(f"Average Wave Height               : {avg_wave:.2f} m")
        print(f"Peak Secondary Swell Height       : {max_swell2:.2f} m")
        print(f"Peak Sea-Level Surge (MSL)        : {max_surge:.2f} m")
        if cross_seas > 0:
            print(f"⚠️  CROSS-SEA HAZARDS DETECTED       : {cross_seas} hourly periods with concurrent swells!")
        else:
            print("✅ Cross-Sea Risk                 : Low")

        print("\nHourly Forecast Preview (Next 12 Hours):")
        print("-" * 70)
        display_cols = [
            "timestamp_utc",
            "wave_height_m",
            "wind_wave_m",
            "wind_wave_period_s",
            "secondary_swell_m",
            "sea_level_msl_m",
            "sea_condition",
        ]
        print(df[display_cols].head(12).to_string(index=False))
        print("-" * 70)

        if args.csv:
            df.to_csv(args.csv, index=False)
            print(f"\n📁 Exported full {len(df)}-hour dataset to: {args.csv}")

    except Exception as exc:
        print(f"❌ Error querying Open-Meteo Marine API: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
