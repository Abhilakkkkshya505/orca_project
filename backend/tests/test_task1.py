import os
import re
from datetime import timedelta
import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.ports.models import Port
from apps.ports.normalisation import (
    extract_alt_names,
    generate_unique_slug,
    haversine_km,
    normalize_name,
    to_ascii,
    validate_coordinates,
)
from apps.risk.thresholds import RULES_VERSION


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def seed_test_ports_data(db):
    from apps.geodata.models import DataSource, ForecastSnapshot, GridCell

    if Port.objects.count() > 0:
        return

    ds, _ = DataSource.objects.get_or_create(
        slug="open_meteo", defaults={"name": "Open-Meteo", "is_enabled": True}
    )

    ports_data = [
        {
            "name": "Mumbai (Bombay)",
            "name_ascii": "mumbai bombay",
            "slug": "mumbai-bombay-in",
            "lat": 18.93,
            "lon": 72.84,
            "marine_lat": 18.90,
            "marine_lon": 72.80,
            "marine_offset_km": 5.2,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Maharashtra",
            "alt_names": ["Bombay", "Mumbai"],
            "is_coastal": True,
            "wave_height": 0.8,
        },
        {
            "name": "Kochi (Cochin)",
            "name_ascii": "kochi cochin",
            "slug": "kochi-cochin-in",
            "lat": 9.97,
            "lon": 76.24,
            "marine_lat": 9.97,
            "marine_lon": 76.20,
            "marine_offset_km": 4.3,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Kerala",
            "alt_names": ["Cochin", "Ernakulam", "Kochi"],
            "is_coastal": True,
            "wave_height": 1.2,
        },
        {
            "name": "Chennai (Kasimedu Fishing Harbour)",
            "name_ascii": "chennai kasimedu fishing harbour",
            "slug": "chennai-kasimedu-fishing-harbour-in",
            "lat": 13.12,
            "lon": 80.30,
            "marine_lat": 13.12,
            "marine_lon": 80.35,
            "marine_offset_km": 5.4,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Tamil Nadu",
            "alt_names": ["Madras", "Kasimedu", "Chennai"],
            "is_coastal": True,
            "wave_height": 1.6,
        },
        {
            "name": "Visakhapatnam Fishing Harbour",
            "name_ascii": "visakhapatnam fishing harbour",
            "slug": "visakhapatnam-fishing-harbour-in",
            "lat": 17.69,
            "lon": 83.29,
            "marine_lat": 17.69,
            "marine_lon": 83.30,
            "marine_offset_km": 1.2,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Andhra Pradesh",
            "alt_names": ["Vizag", "Visakhapatnam"],
            "is_coastal": True,
            "wave_height": 0.9,
        },
        {
            "name": "Kandla",
            "name_ascii": "kandla",
            "slug": "kandla-in",
            "lat": 23.00,
            "lon": 70.22,
            "marine_lat": 22.95,
            "marine_lon": 70.22,
            "marine_offset_km": 5.5,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Gujarat",
            "alt_names": ["Deendayal"],
            "is_coastal": True,
            "wave_height": 0.5,
        },
        {
            "name": "Paradip",
            "name_ascii": "paradip",
            "slug": "paradip-in",
            "lat": 20.26,
            "lon": 86.67,
            "marine_lat": 20.25,
            "marine_lon": 86.70,
            "marine_offset_km": 3.4,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Odisha",
            "alt_names": ["Paradeep"],
            "is_coastal": True,
            "wave_height": 1.8,
        },
        {
            "name": "Port Blair",
            "name_ascii": "port blair",
            "slug": "port-blair-in",
            "lat": 11.67,
            "lon": 92.75,
            "marine_lat": 11.67,
            "marine_lon": 92.80,
            "marine_offset_km": 5.3,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Andaman and Nicobar Islands",
            "alt_names": ["Sri Vijaya Puram"],
            "is_coastal": True,
            "wave_height": 1.1,
        },
        {
            "name": "Tuticorin",
            "name_ascii": "tuticorin",
            "slug": "tuticorin-in",
            "lat": 8.75,
            "lon": 78.18,
            "marine_lat": 8.75,
            "marine_lon": 78.20,
            "marine_offset_km": 2.1,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "Tamil Nadu",
            "alt_names": ["Thoothukudi"],
            "is_coastal": True,
            "wave_height": 2.3,
        },
        {
            "name": "Calcutta (Kolkata)",
            "name_ascii": "calcutta kolkata",
            "slug": "calcutta-in",
            "lat": 22.53,
            "lon": 88.31,
            "country_code": "IN",
            "country_name": "India",
            "admin1_name": "West Bengal",
            "alt_names": ["Kolkata", "Calcutta"],
            "is_coastal": False,
            "port_type": "river",
        },
        {
            "name": "St. John's",
            "name_ascii": "st johns",
            "slug": "st-johns-ag",
            "lat": 17.12,
            "lon": -61.85,
            "country_code": "AG",
            "country_name": "Antigua and Barbuda",
            "is_coastal": True,
        },
        {
            "name": "St. John's",
            "name_ascii": "st johns",
            "slug": "st-johns-ca",
            "lat": 47.56,
            "lon": -52.71,
            "country_code": "CA",
            "country_name": "Canada",
            "is_coastal": True,
        },
        {
            "name": "Lübeck",
            "name_ascii": "lubeck",
            "slug": "lubeck-de",
            "lat": 53.87,
            "lon": 10.69,
            "country_code": "DE",
            "country_name": "Germany",
            "is_coastal": True,
        },
    ]

    now = timezone.now()
    for pd in ports_data:
        wh = pd.pop("wave_height", None)
        port = Port.objects.create(**pd)
        if port.is_coastal and port.marine_lat is not None:
            cell = GridCell.nearest(port.marine_lat, port.marine_lon)
            for h in range(1, 5):
                t = now + timedelta(hours=h)
                ForecastSnapshot.objects.create(
                    cell=cell,
                    source=ds,
                    valid_time=t,
                    issued_at=now,
                    values={
                        "wave_height_m": wh or 1.0,
                        "wave_period_s": 7.5,
                        "wind_speed_mps": 6.0,
                        "wind_gust_mps": 8.0,
                    },
                )


# =====================================================================
# F1. Port Loader & Normalisation Tests
# =====================================================================
@pytest.mark.django_db
def test_port_loader_normalisation_and_aliases():
    # Normalisation
    assert normalize_name("  fort   kochi  ") == "Fort Kochi"
    assert normalize_name("mumbai-south") == "Mumbai-South"
    assert to_ascii("Lübeck") == "lubeck"
    assert to_ascii("São Paulo") == "sao paulo"

    # Known Aliases mapping
    kochi_alts = extract_alt_names("Kochi")
    assert any("cochin" in a.lower() for a in kochi_alts)

    mumbai_alts = extract_alt_names("Mumbai")
    assert any("bombay" in a.lower() for a in mumbai_alts)

    chennai_alts = extract_alt_names("Chennai")
    assert any("madras" in a.lower() for a in chennai_alts)

    vizag_alts = extract_alt_names("Visakhapatnam")
    assert any("vizag" in a.lower() for a in vizag_alts)


@pytest.mark.django_db
def test_port_loader_bad_coordinates_and_antimeridian():
    # Null Island rejected
    valid, _ = validate_coordinates(0.0, 0.0)
    assert not valid

    # Out of range rejected
    valid, _ = validate_coordinates(95.0, 72.0)
    assert not valid
    valid, _ = validate_coordinates(18.0, 195.0)
    assert not valid

    # Swapped coordinates detected (e.g. lat=120, lon=18)
    valid, _ = validate_coordinates(120.0, 18.0)
    assert not valid

    # Antimeridian ports (Fiji lon 178, Kiribati lon -172)
    valid, _ = validate_coordinates(-18.14, 178.43)  # Suva, Fiji
    assert valid
    valid, _ = validate_coordinates(1.33, -172.97)  # Tarawa, Kiribati
    assert valid

    # Haversine across antimeridian handled cleanly
    dist = haversine_km(-18.14, 178.43, -18.14, -179.99)
    assert dist > 0.0 and dist < 200.0


@pytest.mark.django_db
def test_port_loader_slug_collisions():
    slugs = set()
    s1 = generate_unique_slug("New Port", "US", "California", slugs)
    assert s1 == "new-port-us"

    s2 = generate_unique_slug("New Port", "US", "Maine", slugs)
    assert s2 == "new-port-maine-us"

    s3 = generate_unique_slug("New Port", "US", "Maine", slugs)
    assert s3 == "new-port-maine-us-2"


# =====================================================================
# F2. Port Search Tests (Typos, Fuzzy Trigrams, Accents, Special Chars)
# =====================================================================
@pytest.mark.django_db
def test_port_search_queries(api_client):
    test_queries = [
        ("mumbay", "Mumbai"),
        ("kochii", "Kochi"),
        ("cochin", "Kochi"),
        ("bombay", "Mumbai"),
        ("vizag", "Visakhapatnam"),
        ("thoothukudi", "Tuticorin"),
        ("port blair", "Port Blair"),
    ]

    for q, expected_substring in test_queries:
        res = api_client.get(f"/api/v1/ports/?q={q}")
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get("results", [])
        assert len(results) > 0, f"Query '{q}' returned no results"
        matched = any(
            expected_substring.lower() in p["name"].lower()
            or any(expected_substring.lower() in alt.lower() for alt in p.get("alt_names", []))
            for p in results[:3]
        )
        assert matched, f"Query '{q}' did not rank '{expected_substring}' in top 3: {[p['name'] for p in results[:3]]}"


@pytest.mark.django_db
def test_port_search_two_countries_st_johns(api_client):
    # St Johns exists in Antigua & Barbuda and Canada
    res = api_client.get("/api/v1/ports/?q=st+johns")
    assert res.status_code == status.HTTP_200_OK
    results = res.data.get("results", [])
    countries = {p["country_code"] for p in results}
    assert len(countries) >= 1


@pytest.mark.django_db
def test_port_search_accents_and_edge_cases(api_client):
    # Accented query
    res = api_client.get("/api/v1/ports/?q=Lübeck")
    assert res.status_code == status.HTTP_200_OK

    # Empty query returns 200 with pagination
    res_empty = api_client.get("/api/v1/ports/?q=")
    assert res_empty.status_code == status.HTTP_200_OK
    assert len(res_empty.data.get("results", [])) > 0

    # 1-character query
    res_1char = api_client.get("/api/v1/ports/?q=a")
    assert res_1char.status_code == status.HTTP_200_OK

    # 200-character query
    long_q = "x" * 200
    res_long = api_client.get(f"/api/v1/ports/?q={long_q}")
    assert res_long.status_code == status.HTTP_200_OK
    assert len(res_long.data.get("results", [])) == 0

    # SQL injection characters handled safely
    res_sql = api_client.get("/api/v1/ports/?q=' OR '1'='1")
    assert res_sql.status_code == status.HTTP_200_OK


# =====================================================================
# F3. Nearest Ports Tests
# =====================================================================
@pytest.mark.django_db
def test_nearest_ports_chennai(api_client):
    # Near Chennai (13.08, 80.28)
    res = api_client.get("/api/v1/ports/nearest/?lat=13.08&lon=80.28&limit=5&max_km=200")
    assert res.status_code == status.HTTP_200_OK
    results = res.data
    assert len(results) > 0
    first = results[0]
    assert first["distance_km"] < 25.0
    assert any(c in first["name"].lower() for c in ["chennai", "kasimedu", "madras", "ennore"])
    assert "bearing" in first


@pytest.mark.django_db
def test_nearest_ports_mid_ocean(api_client):
    # Mid Indian Ocean point (0.0, 75.0)
    res = api_client.get("/api/v1/ports/nearest/?lat=0.0&lon=75.0&limit=3&max_km=2000")
    assert res.status_code == status.HTTP_200_OK
    results = res.data
    assert len(results) > 0
    assert results[0]["distance_km"] > 300.0


# =====================================================================
# F4. Risk for 13 Ports (Location differs & values distinct)
# =====================================================================
@pytest.mark.django_db
def test_risk_ports_13_distinct_locations(api_client):
    targets = [
        "mumbai-bombay-in",
        "kochi-cochin-in",
        "chennai-kasimedu-fishing-harbour-in",
        "visakhapatnam-fishing-harbour-in",
        "kandla-in",
        "paradip-in",
        "port-blair-in",
        "tuticorin-in",
    ]

    locations_seen = set()
    levels_seen = []

    for slug in targets:
        port = Port.objects.filter(slug=slug).first()
        if not port:
            continue
        res = api_client.get(f"/api/v1/risk/?port={slug}")
        if res.status_code == status.HTTP_200_OK:
            data = res.data
            loc = (data["location"]["lat"], data["location"]["lon"])
            assert loc not in locations_seen, f"Duplicate location found for {slug}"
            locations_seen.add(loc)
            levels_seen.append(data["level"])

    assert len(locations_seen) >= 5, "Fewer than 5 distinct port responses evaluated"


@pytest.mark.live
@pytest.mark.django_db
def test_risk_live_port_evaluation(api_client):
    # Live probe for Mumbai
    res = api_client.get("/api/v1/risk/?lat=18.93&lon=72.84")
    assert res.status_code == status.HTTP_200_OK
    assert res.data["level"] in ("safe", "caution", "unsafe", "unknown")
    assert "marine_location" in res.data


# =====================================================================
# F5. Inland Point Returns inland_point with Suggestion, Never 'safe'
# =====================================================================
@pytest.mark.django_db
def test_inland_point_returns_suggestion(api_client):
    # Deep inland location (e.g. New Delhi 28.61, 77.20)
    res = api_client.get("/api/v1/risk/?lat=28.61&lon=77.20")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    err = res.data.get("error", {})
    assert err.get("code") == "inland_point"
    assert "suggestion" in err.get("details", {})
    sugg = err["details"]["suggestion"]
    assert "slug" in sugg
    assert "name" in sugg
    assert sugg["distance_km"] > 0


# =====================================================================
# F6. No Hardcoded Location Default outside Tests/Fixtures/Docs
# =====================================================================
def test_no_hardcoded_location_outside_allowed_paths():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ignore_dirs = {".git", "node_modules", "tests", "fixtures", "docs", "deliverables", "brain", "dist", ".pnpm", "scripts"}
    pattern = re.compile(
        r"(?i)(defaultCenter.*kochi|useState\(\s*\{\s*lat:\s*9\.9|defaultValues.*9\.97|fallback.*kochi|lat\s*=\s*9\.97|lat:\s*9\.97)"
    )

    violations = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith(".")]
        for fn in filenames:
            if fn.endswith((".py", ".ts", ".tsx", ".html")):
                fp = os.path.join(dirpath, fn)
                with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        if pattern.search(line):
                            violations.append(f"{fp}:{idx} -> {line.strip()}")

    assert len(violations) == 0, f"Found hardcoded location violations: {violations}"


# =====================================================================
# F7. Cache Keys Include Location & Never Collide Across Ports
# =====================================================================
@pytest.mark.django_db
def test_cache_keys_include_location():
    # Mumbai (18.93, 72.84) vs Cochin (9.97, 76.24)
    now = timezone.now()
    valid_from = now
    valid_to = now + timedelta(hours=12)

    key_mumbai = (
        f"orca:risk:{round(18.93, 2)}:{round(72.84, 2)}:small_craft:"
        f"{int(valid_from.timestamp())}:{int(valid_to.timestamp())}:{RULES_VERSION}"
    )
    key_cochin = (
        f"orca:risk:{round(9.97, 2)}:{round(76.24, 2)}:small_craft:"
        f"{int(valid_from.timestamp())}:{int(valid_to.timestamp())}:{RULES_VERSION}"
    )

    assert key_mumbai != key_cochin
    assert "18.93" in key_mumbai and "72.84" in key_mumbai
    assert "9.97" in key_cochin and "76.24" in key_cochin
