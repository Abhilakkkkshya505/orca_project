"""orca_ml.serve: model loader, adoption gate enforcement, and inference service."""

from orca_ml.serve.loader import ModelRegistry
from orca_ml.serve.predict import (
    predict_fishing_suitability_for_port,
    cluster_grid_points,
)

__all__ = [
    "ModelRegistry",
    "predict_fishing_suitability_for_port",
    "cluster_grid_points",
]
