"""
Open-Meteo Marine Data Adapter (slug: open_meteo_marine).
Fetches hourly ocean wave, swell, and hydrodynamic metrics from the Open-Meteo Marine API.
Attribution: Marine weather data from Open-Meteo.com under CC-BY 4.0 with data from DWD and NOAA.
"""

from datetime import datetime, timezone
from typing import Any
import requests
import structlog

from apps.geodata.contracts import NormalizedTelemetry
from apps.geodata.sources.base import BaseAdapter, RawRecord

logger = structlog.get_logger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
ATTRIBUTION_TEXT = "Marine weather data from Open-Meteo.com under CC-BY 4.0 with data from DWD and NOAA."


class OpenMeteoMarineAdapter(BaseAdapter):
    slug = "open_meteo_marine"
    name = "Open-Meteo Marine"
    attribution = ATTRIBUTION_TEXT

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """Fetches 7 days of hourly marine wave telemetry."""
        issued_at = datetime.now(timezone.utc)
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": (
                "wave_height,wave_period,wave_direction,"
                "swell_wave_height,swell_wave_period,wind_wave_height"
            ),
            "timezone": "UTC",
            "forecast_days": 7,
        }

        def _do_get():
            resp = requests.get(OPEN_METEO_MARINE_URL, params=params, timeout=self.timeout_seconds)
            resp.raise_for_status()
            return resp.json()

        try:
            data = self._execute_with_retry(_do_get)
            return [
                RawRecord(
                    source_slug=self.slug,
                    lat=lat,
                    lon=lon,
                    issued_at=issued_at,
                    data=data,
                )
            ]
        except Exception as e:
            self.record_error(str(e))
            logger.warning("open_meteo_marine_fetch_failed", error=str(e), lat=lat, lon=lon)
            return []

    def fetch_batch(self, coordinates: list[tuple[float, float]]) -> list[RawRecord]:
        """Fetches batch coordinates in a single multi-coordinate request."""
        if not coordinates:
            return []
        issued_at = datetime.now(timezone.utc)
        lats = ",".join(str(round(c[0], 4)) for c in coordinates)
        lons = ",".join(str(round(c[1], 4)) for c in coordinates)
        params = {
            "latitude": lats,
            "longitude": lons,
            "hourly": (
                "wave_height,wave_period,wave_direction,"
                "swell_wave_height,swell_wave_period,wind_wave_height"
            ),
            "timezone": "UTC",
            "forecast_days": 7,
        }

        def _do_get():
            resp = requests.get(OPEN_METEO_MARINE_URL, params=params, timeout=self.timeout_seconds + 5.0)
            resp.raise_for_status()
            return resp.json()

        try:
            data = self._execute_with_retry(_do_get)
            results = []
            if isinstance(data, list):
                for idx, item in enumerate(data):
                    c_lat, c_lon = coordinates[idx]
                    results.append(
                        RawRecord(
                            source_slug=self.slug,
                            lat=c_lat,
                            lon=c_lon,
                            issued_at=issued_at,
                            data=item,
                        )
                    )
            elif isinstance(data, dict):
                c_lat, c_lon = coordinates[0]
                results.append(
                    RawRecord(
                        source_slug=self.slug,
                        lat=c_lat,
                        lon=c_lon,
                        issued_at=issued_at,
                        data=data,
                    )
                )
            return results
        except Exception as e:
            self.record_error(str(e))
            logger.warning("open_meteo_marine_batch_failed", error=str(e), count=len(coordinates))
            return []

    def normalise(self, raw: RawRecord) -> list[NormalizedTelemetry]:
        """Normalises raw Open-Meteo marine JSON payload to canonical records."""
        results = []
        hourly = raw.data.get("hourly", {})
        times = hourly.get("time", [])
        wave_heights = hourly.get("wave_height", [])
        wave_periods = hourly.get("wave_period", [])
        wave_dirs = hourly.get("wave_direction", [])
        swell_heights = hourly.get("swell_wave_height", [])
        swell_periods = hourly.get("swell_wave_period", [])
        wind_wave_heights = hourly.get("wind_wave_height", [])

        for i, t_str in enumerate(times):
            try:
                valid_dt = datetime.fromisoformat(t_str)
                if valid_dt.tzinfo is None:
                    valid_dt = valid_dt.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            wh = wave_heights[i] if i < len(wave_heights) else None
            wp = wave_periods[i] if i < len(wave_periods) else None
            wd = wave_dirs[i] if i < len(wave_dirs) else None
            sw_h = swell_heights[i] if i < len(swell_heights) else None
            sw_p = swell_periods[i] if i < len(swell_periods) else None
            ww_h = wind_wave_heights[i] if i < len(wind_wave_heights) else None

            rec = NormalizedTelemetry(
                source_slug=self.slug,
                valid_time=valid_dt,
                issued_at=raw.issued_at,
                wave_height_m=wh,
                wave_period_s=wp,
                wave_direction_deg=wd,
                swell_wave_height_m=sw_h,
                swell_wave_period_s=sw_p,
                wind_wave_height_m=ww_h,
            )
            results.append(rec)

        return results
