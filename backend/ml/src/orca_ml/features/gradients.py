"""
Spatial gradient and ocean thermal/chlorophyll front computation.
Calculates gradient magnitude in physical units (°C/km and mg/m³/km).
"""

import math
import numpy as np


def compute_spatial_gradient(
    val_center: float,
    val_north: float | None = None,
    val_south: float | None = None,
    val_east: float | None = None,
    val_west: float | None = None,
    lat_deg: float = 15.0,
    cell_size_deg: float = 0.1,
) -> float:
    """
    Computes spatial gradient magnitude using central or forward finite differences.
    dx = cell_size_deg * 111.0 * cos(lat)
    dy = cell_size_deg * 111.0
    Returns: gradient magnitude per kilometer.
    """
    dy_km = cell_size_deg * 111.0
    dx_km = cell_size_deg * 111.0 * max(0.2, math.cos(math.radians(lat_deg)))

    # Y gradient (North-South)
    if val_north is not None and val_south is not None:
        grad_y = (val_north - val_south) / (2.0 * dy_km)
    elif val_north is not None:
        grad_y = (val_north - val_center) / dy_km
    elif val_south is not None:
        grad_y = (val_center - val_south) / dy_km
    else:
        grad_y = 0.0

    # X gradient (East-West)
    if val_east is not None and val_west is not None:
        grad_x = (val_east - val_west) / (2.0 * dx_km)
    elif val_east is not None:
        grad_x = (val_east - val_center) / dx_km
    elif val_west is not None:
        grad_x = (val_center - val_west) / dx_km
    else:
        grad_x = 0.0

    magnitude = math.sqrt(grad_x**2 + grad_y**2)
    return round(magnitude, 4)


def is_front(gradient_magnitude: float, threshold: float = 0.02) -> int:
    """Returns 1 if gradient indicates a thermal/chlorophyll front, else 0."""
    return 1 if gradient_magnitude >= threshold else 0
