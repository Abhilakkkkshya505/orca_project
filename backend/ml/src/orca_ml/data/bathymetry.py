"""
Bathymetry and distance-to-coast feature computation for Indian Ocean coastal grid.
"""

import math


def estimate_bathymetric_depth(lat: float, lon: float) -> float:
    """
    Estimates water depth in meters (negative below sea level)
    based on distance from Indian subcontinent shelf.
    Continental shelf (0-200m) extends ~30-70km offshore.
    """
    # Simple, continuous physics-guided coastal bathymetric approximation
    # Deep ocean reaches -3000m to -4500m; shallow coastal waters -5m to -50m
    dist_approx = min(abs(lat - 8.0) * 111.0, abs(lon - 72.0) * 105.0)
    depth = -max(10.0, min(4200.0, dist_approx * 18.0))
    return round(depth, 1)


def calculate_distance_to_coast_km(lat: float, lon: float) -> float:
    """
    Calculates approximate distance to nearest Indian / regional coastline in kilometers.
    """
    # Bounding line approximations for Peninsular India
    # West Coast ~ 72.0E to 77.0E from 8.0N to 23.0N
    # East Coast ~ 80.0E to 87.0E from 8.0N to 22.0N
    if 8.0 <= lat <= 23.0:
        if lon < 77.0:
            d_west = abs(lon - (72.8 + (lat - 18.9) * -0.15)) * 105.0
            return max(1.0, round(d_west, 1))
        else:
            d_east = abs(lon - (80.2 + (lat - 13.0) * 0.45)) * 105.0
            return max(1.0, round(d_east, 1))
    return max(5.0, round(abs(lat - 10.0) * 50.0, 1))
