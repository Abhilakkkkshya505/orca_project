"""
Port proximity calculations for fishing suitability modeling.
Reads from ORCA Port model or canonical coastal port list.
"""

import math
from typing import Any

CANONICAL_INDIAN_PORTS = [
    {"name": "Mumbai", "lat": 18.93, "lon": 72.84},
    {"name": "Kochi", "lat": 9.97, "lon": 76.24},
    {"name": "Chennai", "lat": 13.12, "lon": 80.30},
    {"name": "Vishakhapatnam", "lat": 17.69, "lon": 83.29},
    {"name": "Kandla", "lat": 23.00, "lon": 70.22},
    {"name": "Paradip", "lat": 20.26, "lon": 86.67},
    {"name": "New Mangalore", "lat": 12.92, "lon": 74.82},
    {"name": "Mormugao", "lat": 15.42, "lon": 73.80},
    {"name": "Tuticorin", "lat": 8.75, "lon": 78.18},
    {"name": "Haldia", "lat": 22.02, "lon": 88.06},
    {"name": "Veraval", "lat": 20.90, "lon": 70.37},
    {"name": "Porbandar", "lat": 21.64, "lon": 69.60},
    {"name": "Beypore", "lat": 11.18, "lon": 75.80},
    {"name": "Kollam", "lat": 8.88, "lon": 76.60},
    {"name": "Vizhinjam", "lat": 8.38, "lon": 76.99},
    {"name": "Port Blair", "lat": 11.67, "lon": 92.75},
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * R * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def find_distance_to_nearest_port(lat: float, lon: float) -> tuple[float, str]:
    """
    Returns (distance_km, nearest_port_name).
    """
    try:
        from apps.ports.models import Port
        ports = list(Port.objects.filter(is_active=True, is_coastal=True).values("name", "lat", "lon")[:100])
        if not ports:
            ports = CANONICAL_INDIAN_PORTS
    except Exception:
        ports = CANONICAL_INDIAN_PORTS

    min_dist = float("inf")
    best_name = "Unknown Port"

    for p in ports:
        d = haversine_km(lat, lon, p["lat"], p["lon"])
        if d < min_dist:
            min_dist = d
            best_name = p["name"]

    return round(min_dist, 1), best_name
