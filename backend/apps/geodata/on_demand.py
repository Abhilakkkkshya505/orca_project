from datetime import datetime, timezone as py_timezone
import logging
import requests
from django.core.cache import cache
from django.utils import timezone
from apps.geodata.models import DataSource, ForecastSnapshot, GridCell

logger = logging.getLogger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
OPEN_METEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_on_demand_snapshots(
    lat: float,
    lon: float,
    sea_lat: float,
    sea_lon: float,
    valid_from: datetime,
    valid_to: datetime,
) -> int:
    """
    On-demand fetch service for arbitrary map clicks or unscheduled ports.
    Documented exception to 'no external calls during a request':
    - 30-minute Redis cache
    - 5.0 second timeout
    - Merges Open-Meteo marine (at sea_lat/sea_lon) with weather (at lat/lon)
    """
    cache_key = f"orca:ondemand:{round(sea_lat, 2)}:{round(sea_lon, 2)}"
    if cache.get(cache_key):
        return 0

    ds, _ = DataSource.objects.get_or_create(
        slug="open_meteo",
        defaults={"name": "Open-Meteo Marine & Weather", "is_enabled": True},
    )

    cell = GridCell.nearest(sea_lat, sea_lon)
    now = timezone.now()

    try:
        # 1. Fetch marine variables at sea location (waves, swells, sea level)
        m_params = {
            "latitude": f"{sea_lat:.4f}",
            "longitude": f"{sea_lon:.4f}",
            "hourly": (
                "wave_height,wave_direction,wave_period,"
                "wind_wave_height,wind_wave_direction,wind_wave_period,"
                "secondary_swell_wave_height,sea_level_height_msl"
            ),
            "forecast_days": 3,
        }
        m_resp = requests.get(
            OPEN_METEO_MARINE_URL,
            params=m_params,
            headers={"User-Agent": "ORCA-OnDemand/1.0"},
            timeout=5.0,
        )

        # 2. Fetch atmospheric weather variables at port / landing location
        w_params = {
            "latitude": f"{lat:.4f}",
            "longitude": f"{lon:.4f}",
            "hourly": "wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,visibility",
            "forecast_days": 3,
        }
        w_resp = requests.get(
            OPEN_METEO_WEATHER_URL,
            params=w_params,
            headers={"User-Agent": "ORCA-OnDemand/1.0"},
            timeout=5.0,
        )

        if m_resp.status_code != 200 or w_resp.status_code != 200:
            logger.warning("on_demand_fetch_failed", m_status=m_resp.status_code, w_status=w_resp.status_code)
            return 0

        m_data = m_resp.json().get("hourly", {})
        w_data = w_resp.json().get("hourly", {})

        times = m_data.get("time", [])
        wave_heights = m_data.get("wave_height", [])
        wave_dirs = m_data.get("wave_direction", [])
        wave_periods = m_data.get("wave_period", [])
        wind_waves = m_data.get("wind_wave_height", [])
        wind_wave_dirs = m_data.get("wind_wave_direction", [])
        wind_wave_periods = m_data.get("wind_wave_period", [])
        secondary_swells = m_data.get("secondary_swell_wave_height", [])
        sea_levels = m_data.get("sea_level_height_msl", [])

        wind_speeds = w_data.get("wind_speed_10m", [])
        wind_gusts = w_data.get("wind_gusts_10m", [])
        wind_dirs = w_data.get("wind_direction_10m", [])
        rains = w_data.get("precipitation", [])

        count = 0
        for i, t_str in enumerate(times):
            vt = datetime.fromisoformat(t_str).replace(tzinfo=py_timezone.utc)
            if vt < valid_from - timezone.timedelta(hours=2) or vt > valid_to + timezone.timedelta(hours=2):
                continue

            vals = {}
            if i < len(wave_heights) and wave_heights[i] is not None:
                vals["wave_height_m"] = float(wave_heights[i])
            if i < len(wave_dirs) and wave_dirs[i] is not None:
                vals["wave_direction_deg"] = float(wave_dirs[i])
            if i < len(wave_periods) and wave_periods[i] is not None:
                vals["wave_period_s"] = float(wave_periods[i])
            if i < len(wind_waves) and wind_waves[i] is not None:
                vals["wind_wave_height_m"] = float(wind_waves[i])
            if i < len(wind_wave_dirs) and wind_wave_dirs[i] is not None:
                vals["wind_wave_direction_deg"] = float(wind_wave_dirs[i])
            if i < len(wind_wave_periods) and wind_wave_periods[i] is not None:
                vals["wind_wave_period_s"] = float(wind_wave_periods[i])
            if i < len(secondary_swells) and secondary_swells[i] is not None:
                vals["secondary_swell_wave_height_m"] = float(secondary_swells[i])
            if i < len(sea_levels) and sea_levels[i] is not None:
                vals["sea_level_height_msl_m"] = float(sea_levels[i])

            if i < len(wind_speeds) and wind_speeds[i] is not None:
                vals["wind_speed_kmh"] = float(wind_speeds[i])
            if i < len(wind_gusts) and wind_gusts[i] is not None:
                vals["wind_gust_kmh"] = float(wind_gusts[i])
            if i < len(wind_dirs) and wind_dirs[i] is not None:
                vals["wind_direction_deg"] = float(wind_dirs[i])
            if i < len(rains) and rains[i] is not None:
                vals["rain_mm"] = float(rains[i])

            ForecastSnapshot.objects.update_or_create(
                cell=cell,
                source=ds,
                valid_time=vt,
                issued_at=now,
                defaults={"values": vals},
            )
            count += 1

        # Cache this cell coordinate for 30 minutes (1800 seconds)
        cache.set(cache_key, "1", timeout=1800)
        return count
    except Exception as e:
        logger.warning(f"on_demand_exception: {e}")
        return 0
