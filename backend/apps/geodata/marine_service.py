"""
Service for fetching and transforming Open-Meteo high-resolution marine wave telemetry.
Implements Open-Meteo marine FlatBuffer client with cache, retry, and pandas timeseries processing.
"""
from datetime import datetime, timezone
import logging
import numpy as np
import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry

logger = logging.getLogger(__name__)

# Setup persistent cached session and retry mechanism (1 hour cache)
_cache_session = requests_cache.CachedSession(".cache/openmeteo_marine", expire_after=3600)
_retry_session = retry(_cache_session, retries=5, backoff_factor=0.2)
_client = openmeteo_requests.Client(session=_retry_session)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"


def get_douglas_state(wave_height: float | None) -> tuple[int, str]:
    if wave_height is None or np.isnan(wave_height):
        return 0, "Unknown"
    if wave_height < 0.1:
        return 0, "Calm (glassy)"
    elif wave_height < 0.5:
        return 1, "Calm (rippled)"
    elif wave_height < 1.25:
        return 2, "Smooth (wavelets)"
    elif wave_height < 2.5:
        return 3, "Slight"
    elif wave_height < 4.0:
        return 4, "Moderate"
    elif wave_height < 6.0:
        return 5, "Rough"
    elif wave_height < 9.0:
        return 6, "Very rough"
    elif wave_height < 14.0:
        return 7, "High"
    else:
        return 8, "Very high / Phenomenal"


def fetch_openmeteo_marine_telemetry(lat: float, lon: float, forecast_days: int = 7) -> dict:
    """
    Queries Open-Meteo Marine API and returns structured telemetry.
    """
    params = {
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "hourly": [
            "wave_height",
            "wave_direction",
            "wind_wave_height",
            "wind_wave_direction",
            "wind_wave_period",
            "secondary_swell_wave_height",
            "sea_level_height_msl",
        ],
        "forecast_days": min(max(int(forecast_days), 1), 7),
    }

    try:
        responses = _client.weather_api(OPEN_METEO_MARINE_URL, params=params)
        if not responses:
            raise ValueError(f"No response returned from Open-Meteo for ({lat}, {lon})")

        response = responses[0]
        resolved_lat = float(response.Latitude())
        resolved_lon = float(response.Longitude())
        elevation = float(response.Elevation())

        hourly = response.Hourly()
        v_wave_height = hourly.Variables(0).ValuesAsNumpy()
        v_wave_dir = hourly.Variables(1).ValuesAsNumpy()
        v_wind_wave_height = hourly.Variables(2).ValuesAsNumpy()
        v_wind_wave_dir = hourly.Variables(3).ValuesAsNumpy()
        v_wind_wave_period = hourly.Variables(4).ValuesAsNumpy()
        v_secondary_swell = hourly.Variables(5).ValuesAsNumpy()
        v_sea_level_msl = hourly.Variables(6).ValuesAsNumpy()

        start_dt = pd.to_datetime(hourly.Time(), unit="s", utc=True)
        end_dt = pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True)
        interval_sec = hourly.Interval()

        date_range = pd.date_range(
            start=start_dt,
            end=end_dt,
            freq=pd.Timedelta(seconds=interval_sec),
            inclusive="left",
        )

        hourly_points = []
        cross_sea_count = 0

        for i, dt in enumerate(date_range):
            wh = float(v_wave_height[i]) if i < len(v_wave_height) and not np.isnan(v_wave_height[i]) else None
            wdir = float(v_wave_dir[i]) if i < len(v_wave_dir) and not np.isnan(v_wave_dir[i]) else None
            wwh = float(v_wind_wave_height[i]) if i < len(v_wind_wave_height) and not np.isnan(v_wind_wave_height[i]) else None
            wwdir = float(v_wind_wave_dir[i]) if i < len(v_wind_wave_dir) and not np.isnan(v_wind_wave_dir[i]) else None
            wwper = float(v_wind_wave_period[i]) if i < len(v_wind_wave_period) and not np.isnan(v_wind_wave_period[i]) else None
            sw2 = float(v_secondary_swell[i]) if i < len(v_secondary_swell) and not np.isnan(v_secondary_swell[i]) else None
            slmsl = float(v_sea_level_msl[i]) if i < len(v_sea_level_msl) and not np.isnan(v_sea_level_msl[i]) else None

            scale, cond = get_douglas_state(wh)
            cross_sea = bool(sw2 and wwh and sw2 >= 1.0 and wwh >= 1.0)
            if cross_sea:
                cross_sea_count += 1

            hourly_points.append({
                "valid_time": dt.isoformat(),
                "time_label": dt.strftime("%a %H:%M"),
                "date": dt.strftime("%Y-%m-%d"),
                "hour": dt.hour,
                "wave_height_m": round(wh, 2) if wh is not None else None,
                "wave_direction_deg": round(wdir, 1) if wdir is not None else None,
                "wind_wave_height_m": round(wwh, 2) if wwh is not None else None,
                "wind_wave_direction_deg": round(wwdir, 1) if wwdir is not None else None,
                "wind_wave_period_s": round(wwper, 1) if wwper is not None else None,
                "secondary_swell_m": round(sw2, 2) if sw2 is not None else None,
                "sea_level_msl_m": round(slmsl, 2) if slmsl is not None else None,
                "douglas_scale": scale,
                "sea_condition": cond,
                "cross_sea_warning": cross_sea,
            })

        current_pt = hourly_points[0] if hourly_points else None
        valid_whs = [p["wave_height_m"] for p in hourly_points if p["wave_height_m"] is not None]
        valid_sls = [p["sea_level_msl_m"] for p in hourly_points if p["sea_level_msl_m"] is not None]
        valid_sws = [p["secondary_swell_m"] for p in hourly_points if p["secondary_swell_m"] is not None]

        return {
            "query": {
                "latitude": lat,
                "longitude": lon,
                "resolved_latitude": resolved_lat,
                "resolved_longitude": resolved_lon,
                "elevation_m": elevation,
                "forecast_days": forecast_days,
            },
            "source": {
                "name": "Open-Meteo Marine API",
                "url": OPEN_METEO_MARINE_URL,
                "attribution": "Open-Meteo / Copernicus Marine Service (CMEMS)",
            },
            "current": current_pt,
            "summary": {
                "total_hours": len(hourly_points),
                "max_wave_height_m": max(valid_whs) if valid_whs else None,
                "min_wave_height_m": min(valid_whs) if valid_whs else None,
                "avg_wave_height_m": round(sum(valid_whs) / len(valid_whs), 2) if valid_whs else None,
                "max_secondary_swell_m": max(valid_sws) if valid_sws else None,
                "max_sea_level_surge_m": max(valid_sls) if valid_sls else None,
                "min_sea_level_surge_m": min(valid_sls) if valid_sls else None,
                "cross_sea_hours_count": cross_sea_count,
            },
            "hourly": hourly_points,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error(f"fetch_openmeteo_marine_telemetry failed for ({lat}, {lon}): {e}")
        raise
