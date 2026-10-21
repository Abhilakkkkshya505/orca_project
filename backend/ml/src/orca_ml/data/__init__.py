"""
Data ingest and provenance modules for orca_ml.
"""

from .bathymetry import calculate_distance_to_coast_km, estimate_bathymetric_depth
from .gfw import GFWClient
from .manifest import DataManifest, DatasetEntry
from .ports import find_distance_to_nearest_port, haversine_km
from .sst_chl import NOAAERDDAPClient

__all__ = [
    "calculate_distance_to_coast_km",
    "estimate_bathymetric_depth",
    "GFWClient",
    "DataManifest",
    "DatasetEntry",
    "find_distance_to_nearest_port",
    "haversine_km",
    "NOAAERDDAPClient",
]
