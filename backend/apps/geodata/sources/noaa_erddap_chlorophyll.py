"""
NOAA CoastWatch ERDDAP Chlorophyll-a Adapter (slug: noaa_erddap_chlorophyll).
Dataset ID: erdMH1chla8day (MODIS-Aqua Chlorophyll-a 8-day composite) or nesdisVHNSQchlaDaily.
License: Public Domain / Open NOAA CoastWatch.
Attribution: Satellite Chlorophyll-a telemetry provided by NOAA CoastWatch / OceanWatch.
"""

from datetime import datetime, timezone
from typing import Any
import requests
import structlog

from apps.geodata.contracts import NormalizedTelemetry, QualityFlag
from apps.geodata.sources.base import BaseAdapter, RawRecord

logger = structlog.get_logger(__name__)

ERDDAP_GRIDDAP_BASE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap"
DATASET_ID_CHLA = "erdMH1chla8day"
ATTRIBUTION_TEXT = "Satellite Chlorophyll-a telemetry provided by NOAA CoastWatch / OceanWatch."


class NoaaErddapChlorophyllAdapter(BaseAdapter):
    slug = "noaa_erddap_chlorophyll"
    name = "NOAA CoastWatch ERDDAP Chlorophyll-a"
    attribution = ATTRIBUTION_TEXT
    timeout_seconds = 10.0

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """
        Fetches the latest Chlorophyll-a concentration for a bounded box around the coordinate.
        """
        issued_at = datetime.now(timezone.utc)
        min_lat = round(lat - 0.05, 3)
        max_lat = round(lat + 0.05, 3)
        min_lon = round(lon - 0.05, 3)
        max_lon = round(lon + 0.05, 3)

        url = (
            f"{ERDDAP_GRIDDAP_BASE}/{DATASET_ID_CHLA}.json?"
            f"chlorophyll[(last)][({min_lat}):1:({max_lat})][({min_lon}):1:({max_lon})]"
        )

        def _do_get():
            resp = requests.get(url, timeout=self.timeout_seconds)
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
            logger.warning("noaa_erddap_chlorophyll_fetch_failed", error=str(e), lat=lat, lon=lon)
            return []

    def normalise(self, raw: RawRecord) -> list[NormalizedTelemetry]:
        """Normalises ERDDAP JSON response table into NormalizedTelemetry records."""
        results = []
        table = raw.data.get("table", {})
        column_names = table.get("columnNames", [])
        rows = table.get("rows", [])

        time_idx = column_names.index("time") if "time" in column_names else 0
        lat_idx = column_names.index("latitude") if "latitude" in column_names else 1
        lon_idx = column_names.index("longitude") if "longitude" in column_names else 2
        chla_idx = column_names.index("chlorophyll") if "chlorophyll" in column_names else 3

        valid_values = []
        for row in rows:
            t_str = row[time_idx]
            r_lat = float(row[lat_idx])
            raw_val = row[chla_idx]

            try:
                valid_dt = datetime.fromisoformat(t_str.replace("Z", "+00:00"))
            except Exception:
                valid_dt = raw.issued_at

            flags = []
            chla_val = None
            if raw_val is not None:
                try:
                    fval = float(raw_val)
                    if fval > 0.0:
                        chla_val = fval
                        valid_values.append((r_lat, chla_val))
                except (ValueError, TypeError):
                    chla_val = None
            else:
                flags.append(QualityFlag.CLOUD_GAP)

            rec = NormalizedTelemetry(
                source_slug=self.slug,
                valid_time=valid_dt,
                issued_at=raw.issued_at,
                chlorophyll_mg_m3=chla_val,
                quality_flags=flags,
            )
            results.append(rec)

        if len(valid_values) >= 2 and results:
            chlas = [c[1] for c in valid_values]
            diff = max(chlas) - min(chlas)
            for r in results:
                if r.chlorophyll_mg_m3 is not None:
                    r.chlorophyll_gradient = round(diff, 4)

        return results
