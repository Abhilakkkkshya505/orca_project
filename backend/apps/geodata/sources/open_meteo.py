from datetime import UTC, datetime

import requests
import structlog

from apps.geodata.sources.base import BaseAdapter, NormalisedRecord, RawRecord

logger = structlog.get_logger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


class OpenMeteoAdapter(BaseAdapter):
    slug = "open_meteo"
    name = "Open-Meteo Marine & Forecast"

    def is_available(self) -> bool:
        return True  # Free non-commercial API tier requires no key

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """Fetches marine wave and weather forecast hourly data from Open-Meteo."""
        issued_at = datetime.now(UTC)
        records = []

        try:
            # 1. Marine forecast
            marine_params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "wave_height,wave_period,wave_direction",
                "timezone": "UTC",
                "forecast_days": 2,
            }
            marine_resp = requests.get(OPEN_METEO_MARINE_URL, params=marine_params, timeout=8.0)
            marine_resp.raise_for_status()
            marine_json = marine_resp.json()

            # 2. Weather forecast
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "wind_speed_10m,wind_gusts_10m,precipitation",
                "timezone": "UTC",
                "forecast_days": 2,
            }
            weather_resp = requests.get(OPEN_METEO_FORECAST_URL, params=weather_params, timeout=8.0)
            weather_resp.raise_for_status()
            weather_json = weather_resp.json()

            records.append(
                RawRecord(
                    source_slug=self.slug,
                    lat=lat,
                    lon=lon,
                    issued_at=issued_at,
                    data={"marine": marine_json, "weather": weather_json},
                )
            )
        except Exception as e:
            logger.warning("open_meteo_fetch_failed", error=str(e), lat=lat, lon=lon)

        return records

    def normalise(self, raw: RawRecord) -> list[NormalisedRecord]:
        """Normalises hourly Open-Meteo arrays into per-hour NormalisedRecords."""
        results = []
        marine_hourly = raw.data.get("marine", {}).get("hourly", {})
        weather_hourly = raw.data.get("weather", {}).get("hourly", {})

        times = marine_hourly.get("time") or weather_hourly.get("time") or []
        wave_heights = marine_hourly.get("wave_height", [])
        wave_periods = marine_hourly.get("wave_period", [])
        wind_speeds = weather_hourly.get("wind_speed_10m", [])
        wind_gusts = weather_hourly.get("wind_gusts_10m", [])
        precips = weather_hourly.get("precipitation", [])

        for i, t_str in enumerate(times):
            try:
                # ISO timestamp string
                valid_dt = datetime.fromisoformat(t_str)
                if valid_dt.tzinfo is None:
                    valid_dt = valid_dt.replace(tzinfo=UTC)
            except Exception:
                continue

            values = {
                "wave_height_m": float(wave_heights[i])
                if i < len(wave_heights) and wave_heights[i] is not None
                else None,
                "wave_period_s": float(wave_periods[i])
                if i < len(wave_periods) and wave_periods[i] is not None
                else None,
                "wind_speed_kmh": float(wind_speeds[i])
                if i < len(wind_speeds) and wind_speeds[i] is not None
                else None,
                "wind_gust_kmh": float(wind_gusts[i]) if i < len(wind_gusts) and wind_gusts[i] is not None else None,
                "rain_mm": float(precips[i]) if i < len(precips) and precips[i] is not None else 0.0,
            }

            results.append(
                NormalisedRecord(
                    source_slug=self.slug,
                    lat=raw.lat,
                    lon=raw.lon,
                    valid_time=valid_dt,
                    issued_at=raw.issued_at,
                    values=values,
                )
            )

        return results
