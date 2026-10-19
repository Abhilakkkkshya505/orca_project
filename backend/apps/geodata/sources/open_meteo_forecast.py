"""
Open-Meteo Atmospheric Weather Forecast Adapter (slug: open_meteo_forecast).
Fetches hourly wind speed, wind gusts, direction, precipitation, visibility, and surface pressure.
Attribution: Atmospheric wind and weather forecasts from Open-Meteo.com (CC-BY 4.0).
"""

from datetime import datetime, timezone
from typing import Any
import requests
import structlog

from apps.geodata.contracts import NormalizedTelemetry
from apps.geodata.sources.base import BaseAdapter, RawRecord

logger = structlog.get_logger(__name__)

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ATTRIBUTION_TEXT = "Atmospheric wind and weather forecasts from Open-Meteo.com (CC-BY 4.0)."


class OpenMeteoForecastAdapter(BaseAdapter):
    slug = "open_meteo_forecast"
    name = "Open-Meteo Forecast"
    attribution = ATTRIBUTION_TEXT

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """Fetches 7 days of hourly atmospheric wind and weather forecast."""
        issued_at = datetime.now(timezone.utc)
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": (
                "wind_speed_10m,wind_gusts_10m,wind_direction_10m,"
                "precipitation,visibility,surface_pressure"
            ),
            "wind_speed_unit": "kmh",
            "timezone": "UTC",
            "forecast_days": 7,
        }

        def _do_get():
            resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=self.timeout_seconds)
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
            logger.warning("open_meteo_forecast_fetch_failed", error=str(e), lat=lat, lon=lon)
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
                "wind_speed_10m,wind_gusts_10m,wind_direction_10m,"
                "precipitation,visibility,surface_pressure"
            ),
            "wind_speed_unit": "kmh",
            "timezone": "UTC",
            "forecast_days": 7,
        }

        def _do_get():
            resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=self.timeout_seconds + 5.0)
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
            logger.warning("open_meteo_forecast_batch_failed", error=str(e), count=len(coordinates))
            return []

    def normalise(self, raw: RawRecord) -> list[NormalizedTelemetry]:
        """Normalises raw Open-Meteo forecast JSON payload to canonical records."""
        results = []
        hourly = raw.data.get("hourly", {})
        times = hourly.get("time", [])
        wind_speeds = hourly.get("wind_speed_10m", [])
        wind_gusts = hourly.get("wind_gusts_10m", [])
        wind_dirs = hourly.get("wind_direction_10m", [])
        precips = hourly.get("precipitation", [])
        visibilities = hourly.get("visibility", [])
        pressures = hourly.get("surface_pressure", [])

        for i, t_str in enumerate(times):
            try:
                valid_dt = datetime.fromisoformat(t_str)
                if valid_dt.tzinfo is None:
                    valid_dt = valid_dt.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            ws = wind_speeds[i] if i < len(wind_speeds) else None
            wg = wind_gusts[i] if i < len(wind_gusts) else None
            wd = wind_dirs[i] if i < len(wind_dirs) else None
            pr = precips[i] if i < len(precips) else None
            vis = visibilities[i] if i < len(visibilities) else None
            pres = pressures[i] if i < len(pressures) else None

            rec = NormalizedTelemetry(
                source_slug=self.slug,
                valid_time=valid_dt,
                issued_at=raw.issued_at,
                wind_speed_kmh=ws,
                wind_gust_kmh=wg,
                wind_direction_deg=wd,
                precipitation_mm_h=pr,
                visibility_m=vis,
                pressure_hpa=pres,
            )
            results.append(rec)

        return results
