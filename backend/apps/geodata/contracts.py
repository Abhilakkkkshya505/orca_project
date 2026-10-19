"""
Canonical data contracts and Pydantic validation models for ORCA geodata.
All external providers must normalize to these models at the adapter boundary.
"""

from datetime import datetime, timezone
from enum import StrEnum
import logging
import math
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

logger = logging.getLogger(__name__)


class QualityFlag(StrEnum):
    INTERPOLATED = "interpolated"
    MODEL_ONLY = "model_only"
    CLOUD_GAP = "cloud_gap"
    OUT_OF_RANGE = "out_of_range"


# Geophysical sanity bounds: (min_inclusive, max_inclusive)
SANITY_BOUNDS: dict[str, tuple[float, float]] = {
    "wave_height_m": (0.0, 30.0),
    "wave_period_s": (0.0, 30.0),
    "wave_direction_deg": (0.0, 360.0),
    "swell_wave_height_m": (0.0, 30.0),
    "swell_wave_period_s": (0.0, 30.0),
    "wind_wave_height_m": (0.0, 30.0),
    "wind_speed_kmh": (0.0, 400.0),
    "wind_gust_kmh": (0.0, 500.0),
    "wind_direction_deg": (0.0, 360.0),
    "precipitation_mm_h": (0.0, 500.0),
    "visibility_m": (0.0, 100_000.0),
    "pressure_hpa": (850.0, 1085.0),
    "sst_c": (-2.0, 40.0),
    "chlorophyll_mg_m3": (0.001, 100.0),
    "sea_level_m": (-20.0, 20.0),
    "current_speed_ms": (0.0, 10.0),
    "current_direction_deg": (0.0, 360.0),
}


def sanitize_value(name: str, val: Any, flags: list[str]) -> float | None:
    """
    Cleans raw numeric value:
    - Rejects inf, nan, sentinel fill values (-999, -9999, 9999, etc.).
    - Validates against SANITY_BOUNDS.
    - If out of bounds, logs structured warning, sets QualityFlag.OUT_OF_RANGE, and returns None.
    """
    if val is None:
        return None
    try:
        fval = float(val)
    except (ValueError, TypeError):
        return None

    if math.isnan(fval) or math.isinf(fval):
        return None

    # Sentinel fill values common in NetCDF / GRIB / ERDDAP
    if fval in (-999.0, -9999.0, 9999.0, 999.0, -32767.0, 32767.0):
        return None

    bounds = SANITY_BOUNDS.get(name)
    if bounds:
        min_v, max_v = bounds
        if fval < min_v or fval > max_v:
            logger.warning(
                "Value out of geophysical range for %s: %s (allowed: [%s, %s]). Storing None.",
                name,
                fval,
                min_v,
                max_v,
            )
            if QualityFlag.OUT_OF_RANGE not in flags:
                flags.append(QualityFlag.OUT_OF_RANGE)
            return None

    return fval


class NormalizedTelemetry(BaseModel):
    """
    Canonical representation of hourly point observation or forecast.
    Enforces UTC timezone-aware datetimes, physical units, and sanity rejection.
    """

    source_slug: str
    valid_time: datetime
    issued_at: datetime
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quality_flags: list[str] = Field(default_factory=list)

    # Ocean surface wave telemetry
    wave_height_m: float | None = None
    wave_period_s: float | None = None
    wave_direction_deg: float | None = None
    swell_wave_height_m: float | None = None
    swell_wave_period_s: float | None = None
    wind_wave_height_m: float | None = None

    # Atmospheric weather & surface wind telemetry
    wind_speed_kmh: float | None = None
    wind_gust_kmh: float | None = None
    wind_direction_deg: float | None = None
    precipitation_mm_h: float | None = None
    visibility_m: float | None = None
    pressure_hpa: float | None = None

    # Oceanographic satellite & hydrodynamic telemetry
    sst_c: float | None = None
    chlorophyll_mg_m3: float | None = None
    sea_level_m: float | None = None
    current_speed_ms: float | None = None
    current_direction_deg: float | None = None

    # Satellite gradients and fronts
    sst_gradient_c_per_km: float | None = None
    chlorophyll_gradient: float | None = None

    @field_validator("valid_time", "issued_at", "ingested_at", mode="before")
    @classmethod
    def ensure_utc_datetime(cls, v: Any) -> datetime:
        if isinstance(v, str):
            # Parse ISO string
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
        elif isinstance(v, datetime):
            dt = v
        else:
            raise ValueError(f"Invalid datetime format: {v}")

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @model_validator(mode="before")
    @classmethod
    def sanitize_all_metrics(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        flags = list(data.get("quality_flags", []))
        for metric_name in SANITY_BOUNDS:
            if metric_name in data and data[metric_name] is not None:
                data[metric_name] = sanitize_value(metric_name, data[metric_name], flags)

        data["quality_flags"] = flags
        return data

    def to_snapshot_dict(self) -> dict[str, Any]:
        """Returns clean dictionary of values for ForecastSnapshot.values JSON field."""
        metrics = {}
        for k in SANITY_BOUNDS:
            val = getattr(self, k, None)
            if val is not None:
                metrics[k] = val
        if self.sst_gradient_c_per_km is not None:
            metrics["sst_gradient_c_per_km"] = self.sst_gradient_c_per_km
        if self.chlorophyll_gradient is not None:
            metrics["chlorophyll_gradient"] = self.chlorophyll_gradient
        metrics["quality_flags"] = self.quality_flags
        return metrics
