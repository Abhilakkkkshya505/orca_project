"""
NOAA CoastWatch ERDDAP SST Adapter (slug: noaa_erddap_sst).
Dataset ID: jplMURSST41 (JPL Multi-Scale Ultra-High Resolution SST Analysis, Daily, 0.01 deg).
License: Public Domain / Open NOAA CoastWatch.
Attribution: Satellite SST telemetry provided by NOAA CoastWatch / OceanWatch / JPL MUR SST.
"""

from datetime import datetime, timezone
import math
from typing import Any
import requests
import structlog

from apps.geodata.contracts import NormalizedTelemetry, QualityFlag
from apps.geodata.sources.base import BaseAdapter, RawRecord

logger = structlog.get_logger(__name__)

ERDDAP_GRIDDAP_BASE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap"
DATASET_ID_SST = "jplMURSST41"
ATTRIBUTION_TEXT = "Satellite SST telemetry provided by NOAA CoastWatch / OceanWatch."


class NoaaErddapSstAdapter(BaseAdapter):
    slug = "noaa_erddap_sst"
    name = "NOAA CoastWatch ERDDAP SST"
    attribution = ATTRIBUTION_TEXT
    timeout_seconds = 10.0

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """
        Fetches the latest SST observation for a bounded spatial box around the point.
        Uses a tight 0.1 deg box for the last available time slice.
        """
        issued_at = datetime.now(timezone.utc)
        min_lat = round(lat - 0.05, 3)
        max_lat = round(lat + 0.05, 3)
        min_lon = round(lon - 0.05, 3)
        max_lon = round(lon + 0.05, 3)

        url = (
            f"{ERDDAP_GRIDDAP_BASE}/{DATASET_ID_SST}.json?"
            f"analysed_sst[(last)][({min_lat}):1:({max_lat})][({min_lon}):1:({max_lon})]"
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
            logger.warning("noaa_erddap_sst_fetch_failed", error=str(e), lat=lat, lon=lon)
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
        sst_idx = column_names.index("analysed_sst") if "analysed_sst" in column_names else 3

        # Collect valid temperatures to compute spatial gradient
        valid_cells = []
        for row in rows:
            t_str = row[time_idx]
            r_lat = float(row[lat_idx])
            r_lon = float(row[lon_idx])
            raw_val = row[sst_idx]

            try:
                valid_dt = datetime.fromisoformat(t_str.replace("Z", "+00:00"))
            except Exception:
                valid_dt = raw.issued_at

            flags = []
            sst_c = None
            if raw_val is not None:
                try:
                    fval = float(raw_val)
                    # Handle Kelvin if provided in K
                    if fval > 150.0:
                        fval -= 273.15
                    sst_c = fval
                    valid_cells.append((r_lat, r_lon, sst_c))
                except (ValueError, TypeError):
                    sst_c = None
            else:
                flags.append(QualityFlag.CLOUD_GAP)

            rec = NormalizedTelemetry(
                source_slug=self.slug,
                valid_time=valid_dt,
                issued_at=raw.issued_at,
                sst_c=sst_c,
                quality_flags=flags,
            )
            results.append(rec)

        # Compute gradient if multiple points exist
        if len(valid_cells) >= 2 and results:
            lats = [c[0] for c in valid_cells]
            ssts = [c[2] for c in valid_cells]
            delta_sst = max(ssts) - min(ssts)
            delta_dist_km = max(0.5, (max(lats) - min(lats)) * 111.0)
            gradient = round(delta_sst / delta_dist_km, 4)
            for r in results:
                if r.sst_c is not None:
                    r.sst_gradient_c_per_km = gradient

        return results
