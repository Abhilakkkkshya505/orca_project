"""
Canonical feature extraction pipeline for fishing activity suitability modeling.
Rule 22: ONE implementation used by training AND serving.
Tests must assert identical feature vector outputs for the same raw inputs.
"""

from dataclasses import asdict, dataclass
import math
from typing import Any
import numpy as np

from orca_ml.data.bathymetry import calculate_distance_to_coast_km, estimate_bathymetric_depth
from orca_ml.data.ports import find_distance_to_nearest_port
from orca_ml.features.gradients import compute_spatial_gradient, is_front

FEATURE_NAMES = [
    "sst",
    "chl",
    "log_chl",
    "sst_gradient",
    "chl_gradient",
    "front_indicator",
    "bathymetry_depth_m",
    "dist_to_coast_km",
    "dist_to_nearest_port_km",
    "month_sin",
    "month_cos",
    "sst_lag_1w",
    "sst_lag_2w",
    "chl_lag_1w",
    "chl_lag_2w",
]


@dataclass
class RawObservation:
    lat: float = 0.0
    lon: float = 0.0
    month: int = 1
    sst: float = 28.0
    chl: float = 0.3
    latitude: float | None = None
    longitude: float | None = None
    timestamp: Any = None
    bathymetry_depth_m: float | None = None
    dist_to_coast_km: float | None = None
    dist_to_nearest_port_km: float | None = None
    sst_gradient: float | None = None
    chl_gradient: float | None = None
    front_indicator: float | None = None
    sst_north: float | None = None
    sst_south: float | None = None
    sst_east: float | None = None
    sst_west: float | None = None
    chl_north: float | None = None
    chl_south: float | None = None
    chl_east: float | None = None
    chl_west: float | None = None
    sst_lag_1w: float | None = None
    sst_lag_2w: float | None = None
    chl_lag_1w: float | None = None
    chl_lag_2w: float | None = None

    def __post_init__(self):
        if self.latitude is not None and self.lat == 0.0:
            self.lat = float(self.latitude)
        if self.longitude is not None and self.lon == 0.0:
            self.lon = float(self.longitude)
        if self.timestamp is not None and self.month == 1:
            try:
                self.month = int(pd.Timestamp(self.timestamp).month)
            except Exception:
                pass


def extract_feature_vector(obs: RawObservation) -> list[float]:
    """
    Computes a 15-dimensional canonical feature vector from a raw ocean observation.
    Used identically during training dataset assembly and online serving.
    Does NOT include raw latitude or longitude.
    """
    # 1. Direct and log-transformed metrics
    sst = float(obs.sst)
    chl = max(0.0001, float(obs.chl))
    log_chl = round(math.log(chl), 4)

    # 2. Spatial gradients and fronts
    sst_grad = compute_spatial_gradient(
        val_center=sst,
        val_north=obs.sst_north,
        val_south=obs.sst_south,
        val_east=obs.sst_east,
        val_west=obs.sst_west,
        lat_deg=obs.lat,
    )
    chl_grad = compute_spatial_gradient(
        val_center=chl,
        val_north=obs.chl_north,
        val_south=obs.chl_south,
        val_east=obs.chl_east,
        val_west=obs.chl_west,
        lat_deg=obs.lat,
    )
    front = is_front(sst_grad, threshold=0.015)

    # 3. Bathymetry and geographic proximities
    depth = estimate_bathymetric_depth(obs.lat, obs.lon)
    dist_coast = calculate_distance_to_coast_km(obs.lat, obs.lon)
    dist_port, _ = find_distance_to_nearest_port(obs.lat, obs.lon)

    # 4. Seasonal harmonic encoding
    month_angle = 2.0 * math.pi * (obs.month - 1) / 12.0
    m_sin = round(math.sin(month_angle), 4)
    m_cos = round(math.cos(month_angle), 4)

    # 5. Temporal lags (defaults to current if lag is unavailable)
    sst_l1 = float(obs.sst_lag_1w if obs.sst_lag_1w is not None else sst)
    sst_l2 = float(obs.sst_lag_2w if obs.sst_lag_2w is not None else sst_l1)
    chl_l1 = float(obs.chl_lag_1w if obs.chl_lag_1w is not None else chl)
    chl_l2 = float(obs.chl_lag_2w if obs.chl_lag_2w is not None else chl_l1)

    return [
        sst,
        chl,
        log_chl,
        sst_grad,
        chl_grad,
        float(front),
        depth,
        dist_coast,
        dist_port,
        m_sin,
        m_cos,
        sst_l1,
        sst_l2,
        chl_l1,
        chl_l2,
    ]


def extract_features_df(observations: list[RawObservation]):
    """Batch feature extraction returning a pandas DataFrame."""
    import pandas as pd

    rows = [extract_feature_vector(o) for o in observations]
    return pd.DataFrame(rows, columns=FEATURE_NAMES)
