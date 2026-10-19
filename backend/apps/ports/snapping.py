import logging
import math
import time
from typing import Optional
import requests
from apps.ports.normalisation import haversine_km

logger = logging.getLogger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

# 8 unit direction vectors (dlat, dlon)
DIRECTIONS = [
    (1.0, 0.0),          # N
    (0.7071, 0.7071),    # NE
    (0.0, 1.0),          # E
    (-0.7071, 0.7071),   # SE
    (-1.0, 0.0),         # S
    (-0.7071, -0.7071),  # SW
    (0.0, -1.0),         # W
    (0.7071, -0.7071),   # NW
]

RINGS = [0.05, 0.1, 0.2, 0.3]


def probe_marine_points(coords: list[tuple[float, float]], timeout: float = 6.0) -> list[bool]:
    """
    Probes Open-Meteo marine endpoint for a batch of (lat, lon) coordinates.
    Returns a list of booleans indicating whether each point returns non-null marine wave data.
    """
    if not coords:
        return []

    lats_str = ",".join(f"{c[0]:.4f}" for c in coords)
    lons_str = ",".join(f"{c[1]:.4f}" for c in coords)

    params = {
        "latitude": lats_str,
        "longitude": lons_str,
        "hourly": "wave_height",
        "forecast_days": 1,
    }

    retries = 3
    backoff = 1.0
    for attempt in range(retries):
        try:
            resp = requests.get(
                OPEN_METEO_MARINE_URL,
                params=params,
                headers={"User-Agent": "ORCA-Snapper/1.0 (sustainability-sdg14)"},
                timeout=timeout,
            )
            if resp.status_code == 429:
                logger.warning(f"Rate limited by Open-Meteo. Backing off {backoff}s...")
                time.sleep(backoff)
                backoff *= 2.0
                continue

            if resp.status_code != 200:
                logger.warning(f"Open-Meteo returned status {resp.status_code}")
                return [False] * len(coords)

            data = resp.json()
            items = data if isinstance(data, list) else [data]

            results = []
            for item in items:
                wh = item.get("hourly", {}).get("wave_height", [])
                has_data = any(v is not None for v in wh[:6])
                results.append(has_data)
            return results
        except Exception as e:
            logger.warning(f"Probe request attempt {attempt + 1} failed: {e}")
            time.sleep(backoff)
            backoff *= 1.5

    return [False] * len(coords)


def snap_port_coordinate(
    lat: float, lon: float
) -> tuple[Optional[float], Optional[float], Optional[float], bool]:
    """
    Snaps a port coordinate to the nearest valid sea grid cell:
    1. Probe port coordinate directly. If valid, offset is 0.0 km.
    2. If null, probe concentric rings (0.05, 0.1, 0.2, 0.3 deg) in 8 directions.
    3. Pick nearest valid sea point.
    4. If no valid point within 0.3 deg, return (None, None, None, False) -> is_coastal=False.
    Returns: (marine_lat, marine_lon, marine_offset_km, is_coastal)
    """
    # 1. Probe direct coordinate
    direct_res = probe_marine_points([(lat, lon)])
    if direct_res and direct_res[0]:
        return lat, lon, 0.0, True

    # 2. Build candidate points ordered by ring radius
    candidates: list[tuple[float, float, float]] = []  # (cand_lat, cand_lon, dist_km)
    for r in RINGS:
        ring_coords = []
        for dlat, dlon in DIRECTIONS:
            cand_lat = round(lat + dlat * r, 4)
            cand_lon = round(lon + dlon * r, 4)
            dist_km = haversine_km(lat, lon, cand_lat, cand_lon)
            ring_coords.append((cand_lat, cand_lon, dist_km))

        # Probe the 8 points of this ring in one batch call
        probed = probe_marine_points([(c[0], c[1]) for c in ring_coords])
        valid_ring_points = [
            ring_coords[i] for i, has_data in enumerate(probed) if has_data
        ]

        if valid_ring_points:
            # Sort by actual distance in km and pick nearest
            valid_ring_points.sort(key=lambda x: x[2])
            best = valid_ring_points[0]
            return round(best[0], 4), round(best[1], 4), round(best[2], 2), True

    # 3. No sea point within 0.3 degrees (~33 km)
    return None, None, None, False
