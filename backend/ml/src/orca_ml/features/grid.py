"""
Spatial 0.1-degree grid management for Indian Ocean bounding box.
"""

from typing import Generator


class OceanGrid:
    """Represents a 0.1-degree coastal ocean grid."""

    def __init__(
        self,
        min_lon: float = 65.0,
        max_lon: float = 90.0,
        min_lat: float = 5.0,
        max_lat: float = 25.0,
        resolution_deg: float = 0.1,
    ):
        self.min_lon = min_lon
        self.max_lon = max_lon
        self.min_lat = min_lat
        self.max_lat = max_lat
        self.resolution = resolution_deg

    def iter_cells(self) -> Generator[tuple[float, float], None, None]:
        lat = self.min_lat
        while lat <= self.max_lat:
            lon = self.min_lon
            while lon <= self.max_lon:
                yield round(lat, 2), round(lon, 2)
                lon += self.resolution
            lat += self.resolution

    @staticmethod
    def get_cell_block(lat: float, lon: float, block_size_deg: float = 5.0) -> str:
        """
        Assigns a grid coordinate to a 5x5 degree spatial block for leakage-safe GroupKFold.
        Example: lat=18.9, lon=72.8 -> block_15_70
        """
        return get_cell_block(lat, lon, block_size_deg)

    def generate_port_points(self, port_lat: float, port_lon: float, radius_km: float = 100.0) -> list[dict]:
        """Generate 0.25-deg grid points within radius_km of a given coordinate."""
        points = []
        deg_radius = radius_km / 111.0
        min_lat = max(self.min_lat, port_lat - deg_radius)
        max_lat = min(self.max_lat, port_lat + deg_radius)
        min_lon = max(self.min_lon, port_lon - deg_radius * 1.5)
        max_lon = min(self.max_lon, port_lon + deg_radius * 1.5)

        lat = min_lat
        while lat <= max_lat:
            lon = min_lon
            while lon <= max_lon:
                d = haversine_distance(port_lat, port_lon, lat, lon)
                if d <= radius_km:
                    points.append({
                        "latitude": round(lat, 4),
                        "longitude": round(lon, 4),
                        "dist_to_port_km": round(d, 2),
                    })
                lon += self.resolution
            lat += self.resolution
        return points


def get_cell_block(lat: float, lon: float, block_size_deg: float = 5.0) -> str:
    """Assigns coordinate to 5x5 degree spatial block."""
    b_lat = int(lat // block_size_deg) * int(block_size_deg)
    b_lon = int(lon // block_size_deg) * int(block_size_deg)
    return f"block_{b_lat}_{b_lon}"


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon coordinates."""
    import math
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return float(2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)))

