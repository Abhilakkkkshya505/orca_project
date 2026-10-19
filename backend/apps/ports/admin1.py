import json
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

_ADMIN1_CACHE: list[dict] | None = None


def point_in_poly(x: float, y: float, ring: list[list[float]]) -> bool:
    """Ray casting point-in-polygon algorithm."""
    n = len(ring)
    inside = False
    p1x, p1y = ring[0]
    for i in range(n + 1):
        p2x, p2y = ring[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def _load_admin1_data() -> list[dict]:
    global _ADMIN1_CACHE
    if _ADMIN1_CACHE is not None:
        return _ADMIN1_CACHE

    geojson_path = getattr(settings, "BASE_DIR").parent / "data" / "ports" / "ne_50m_admin_1_states_provinces.geojson"
    if not geojson_path.exists():
        logger.warning(f"Admin-1 geojson not found at {geojson_path}")
        return []

    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        features = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            if not geom:
                continue

            # Compute bounding box for fast filtering
            min_x, min_y = float("inf"), float("inf")
            max_x, max_y = float("-inf"), float("-inf")

            coords = geom.get("coordinates", [])
            polys = [coords] if geom.get("type") == "Polygon" else coords

            sample_points = []
            for poly in polys:
                for ring in poly:
                    for px, py in ring[::max(1, len(ring) // 20)]:
                        sample_points.append((px, py))
                        min_x = min(min_x, px)
                        min_y = min(min_y, py)
                        max_x = max(max_x, px)
                        max_y = max(max_y, py)

            features.append(
                {
                    "name": props.get("name") or props.get("name_en") or "",
                    "code": props.get("code_hasc") or props.get("iso_3166_2") or "",
                    "country": props.get("admin") or props.get("sovereignt") or "",
                    "adm0_a3": props.get("adm0_a3") or "",
                    "iso_a2": (props.get("iso_a2") or "").upper(),
                    "geom_type": geom.get("type"),
                    "polys": polys,
                    "bbox": (min_x, min_y, max_x, max_y),
                    "sample_points": sample_points,
                }
            )

        _ADMIN1_CACHE = features
        return features
    except Exception as e:
        logger.error(f"Failed loading admin1 geojson: {e}")
        return []


def resolve_admin1(lat: float, lon: float, country_code: str = "") -> tuple[str, str]:
    """
    Finds the admin1 state or province for a given coordinate.
    First tests strict point-in-polygon; if in coastal water outside boundary,
    finds the nearest state of the specified country within 100 km.
    """
    cc = (country_code or "").upper().strip()

    # Special Indian coastal UT enclaves / island territories
    if cc == "IN" or not cc:
        # Andaman and Nicobar
        if 6.5 <= lat <= 14.0 and 92.0 <= lon <= 94.5:
            return "Andaman and Nicobar Islands", "IN.AN"
        # Lakshadweep
        if 8.0 <= lat <= 12.5 and 71.5 <= lon <= 74.5:
            return "Lakshadweep", "IN.LD"
        # Daman & Diu enclaves
        if (20.35 <= lat <= 20.48 and 72.78 <= lon <= 72.90) or (20.65 <= lat <= 20.78 and 70.80 <= lon <= 71.05):
            return "Dadra and Nagar Haveli and Daman and Diu", "IN.DH"
        # Puducherry & Karaikal & Mahe
        if (11.85 <= lat <= 12.05 and 79.75 <= lon <= 79.90) or (10.85 <= lat <= 11.00 and 79.80 <= lon <= 79.90) or (11.68 <= lat <= 11.75 and 75.50 <= lon <= 75.58):
            return "Puducherry", "IN.PY"

    features = _load_admin1_data()
    if not features:
        return "", ""

    # 1. Check point-in-polygon with bounding-box prefilter
    candidates = []
    for f in features:
        # If country_code provided, filter by country
        if cc:
            if f["iso_a2"] and f["iso_a2"] != cc:
                if cc == "IN" and f["adm0_a3"] != "IND" and f["country"] != "India":
                    continue
                elif cc != "IN":
                    continue

        min_x, min_y, max_x, max_y = f["bbox"]
        # Expand bbox by 0.5 deg for coastal candidate check
        if min_x - 0.5 <= lon <= max_x + 0.5 and min_y - 0.5 <= lat <= max_y + 0.5:
            candidates.append(f)

    # Test exact point-in-poly on candidates
    for c in candidates:
        for poly in c["polys"]:
            if poly and point_in_poly(lon, lat, poly[0]):
                return c["name"], c["code"]

    # 2. Nearest boundary vertex for coastal water stations
    best_name = ""
    best_code = ""
    min_dist_sq = float("inf")

    target_pool = candidates if candidates else features
    if cc and not candidates:
        target_pool = [
            f for f in features
            if f["iso_a2"] == cc or (cc == "IN" and (f["adm0_a3"] == "IND" or f["country"] == "India"))
        ]

    for c in target_pool:
        for px, py in c["sample_points"]:
            d_sq = (px - lon) ** 2 + (py - lat) ** 2
            if d_sq < min_dist_sq:
                min_dist_sq = d_sq
                best_name = c["name"]
                best_code = c["code"]

    # Only accept nearest if within ~1.5 degrees (~160 km)
    if min_dist_sq <= 2.25:
        return best_name, best_code

    return "", ""
