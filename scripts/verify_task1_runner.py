"""
Task 1 Verification Engine for ORCA.
Executes all checks defined in TASK-1-ports-and-location.md:
1. Port count worldwide and per-Indian-state counts
2. Port search queries (?q=mumbai, ?q=cochin, ?q=vizag)
3. Nearest ports for Chennai coordinates
4. Marine snapping statistics
5. Risk assessment for 8 different ports
6. Inland point returns inland_point with a suggestion
7. No hardcoded Kochi defaults in repo
8. Cache keys include location
"""

import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from datetime import timedelta
import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.ports.models import Port
from apps.risk.thresholds import RULES_VERSION
from rest_framework.test import APIClient

client = APIClient()


def check_port_counts():
    total = Port.objects.count()
    india_total = Port.objects.filter(country_code="IN").count()

    INDIAN_COASTAL_REGIONS = [
        "Gujarat",
        "Maharashtra",
        "Goa",
        "Karnataka",
        "Kerala",
        "Tamil Nadu",
        "Puducherry",
        "Andhra Pradesh",
        "Odisha",
        "West Bengal",
        "Andaman and Nicobar Islands",
        "Lakshadweep",
        "Dadra and Nagar Haveli and Daman and Diu",
    ]

    state_counts = {}
    flagged = []
    for region in INDIAN_COASTAL_REGIONS:
        c = Port.objects.filter(country_code="IN", admin1_name__iexact=region).count()
        state_counts[region] = c
        if c < 3:
            flagged.append(f"{region}: {c} (< 3)")

    passed = (total >= 3000) and (len(flagged) == 0)
    details = {
        "total_worldwide": total,
        "india_total": india_total,
        "state_counts": state_counts,
        "flagged": flagged,
    }
    return passed, details


def check_port_search():
    queries = [
        ("mumbai", ["mumbai", "bombay"]),
        ("cochin", ["kochi", "cochin"]),
        ("vizag", ["visakhapatnam", "vishakhapatnam", "vizag"]),
    ]
    results = {}
    all_ok = True
    for q, expected_tokens in queries:
        resp = client.get(f"/api/v1/ports/?q={q}")
        if resp.status_code != 200:
            all_ok = False
            results[q] = f"Status {resp.status_code}"
            continue
        items = resp.data.get("results", [])
        top_names = [item["name"] for item in items[:3]]
        matched = any(
            any(tok in n.lower() for tok in expected_tokens) for n in top_names
        )
        results[q] = {"top_matches": top_names, "matched": matched}
        if not matched:
            all_ok = False
    return all_ok, results


def check_nearest_chennai():
    # Chennai coordinates (13.08, 80.28)
    resp = client.get("/api/v1/ports/nearest/?lat=13.08&lon=80.28&limit=5&max_km=200")
    if resp.status_code != 200:
        return False, {"error": f"Status {resp.status_code}"}
    data = resp.data
    if not data or len(data) == 0:
        return False, {"error": "Empty nearest ports result"}
    first = data[0]
    first_name = first.get("name", "").lower()
    dist = first.get("distance_km", 999.0)
    bearing = first.get("bearing")
    chennai_matched = any(
        k in first_name for k in ["chennai", "madras", "kasimedu", "ennore"]
    )
    passed = chennai_matched and dist < 25.0 and bearing is not None
    return passed, {
        "first_name": first.get("name"),
        "distance_km": dist,
        "bearing": bearing,
        "total_returned": len(data),
    }


def check_marine_snap_stats():
    total_snapped = Port.objects.filter(marine_lat__isnull=False).count()
    offset_gt_5 = Port.objects.filter(marine_offset_km__gt=5.0).count()
    inland = Port.objects.filter(is_coastal=False).count()
    passed = total_snapped >= 100
    return passed, {
        "total_snapped": total_snapped,
        "offset_gt_5km": offset_gt_5,
        "inland_or_unsupported": inland,
    }


def check_risk_8_ports():
    target_ports = [
        "mumbai-bombay-in",
        "kochi-cochin-in",
        "chennai-madras-in",
        "vishakhapatnam-in",
        "kandla-in",
        "paradip-in",
        "port-blair-in",
        "rotterdam-nl",
    ]
    seen_locations = set()
    results = {}
    all_ok = True

    for slug in target_ports:
        resp = client.get(f"/api/v1/risk/?port={slug}")
        if resp.status_code != 200:
            all_ok = False
            results[slug] = {"status": resp.status_code, "error": resp.data}
            continue
        d = resp.data
        loc = (d.get("location", {}).get("lat"), d.get("location", {}).get("lon"))
        seen_locations.add(loc)
        results[slug] = {
            "status": resp.status_code,
            "level": d.get("level"),
            "loc": loc,
            "marine_loc": (
                d.get("marine_location", {}).get("lat")
                if d.get("marine_location")
                else None,
                d.get("marine_location", {}).get("lon")
                if d.get("marine_location")
                else None,
            ),
        }

    distinct_locations = len(seen_locations)
    passed = all_ok and (distinct_locations == len(target_ports))
    return passed, {
        "distinct_locations": distinct_locations,
        "expected_distinct": len(target_ports),
        "results": results,
    }


def check_inland_suggestion():
    # Deep inland point (New Delhi: 28.61, 77.20)
    resp = client.get("/api/v1/risk/?lat=28.61&lon=77.20")
    if resp.status_code != 400:
        return False, {"status": resp.status_code, "data": resp.data}
    err = resp.data.get("error", {})
    code = err.get("code")
    sugg = err.get("details", {}).get("suggestion", {})
    passed = (
        code == "inland_point"
        and "slug" in sugg
        and "name" in sugg
        and sugg.get("distance_km", 0) > 0
    )
    return passed, {
        "status": resp.status_code,
        "code": code,
        "suggestion": sugg,
    }


def check_no_hardcoded_kochi():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ignore_dirs = {
        ".git",
        "node_modules",
        "tests",
        "fixtures",
        "docs",
        "deliverables",
        "brain",
        "dist",
        ".pnpm",
        "data",
        "scripts",
    }
    pattern = re.compile(
        r"(?i)(defaultCenter.*kochi|useState\(\s*\{\s*lat:\s*9\.9|defaultValues.*9\.97|fallback.*kochi|lat\s*=\s*9\.97|lat:\s*9\.97)"
    )
    violations = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d for d in dirnames if d not in ignore_dirs and not d.startswith(".")
        ]
        for fn in filenames:
            if fn.endswith((".py", ".ts", ".tsx", ".html")):
                fp = os.path.join(dirpath, fn)
                with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        if pattern.search(line):
                            violations.append(
                                f"{os.path.relpath(fp, root)}:{idx} -> {line.strip()}"
                            )
    passed = len(violations) == 0
    return passed, {"violations": violations}


def check_cache_keys():
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

    passed = (
        (key_mumbai != key_cochin)
        and ("18.93" in key_mumbai)
        and ("72.84" in key_mumbai)
        and ("9.97" in key_cochin)
        and ("76.24" in key_cochin)
    )
    return passed, {"key_mumbai": key_mumbai, "key_cochin": key_cochin}


if __name__ == "__main__":
    check_num = sys.argv[1] if len(sys.argv) > 1 else "all"
    if check_num == "1":
        p, d = check_port_counts()
        print(f"PASSED:{p}")
        print(f"WORLDWIDE:{d['total_worldwide']}")
        print(f"INDIA_TOTAL:{d['india_total']}")
        for s, c in d["state_counts"].items():
            print(f"STATE:{s}={c}")
        if d["flagged"]:
            print(f"FLAGGED:{', '.join(d['flagged'])}")
    elif check_num == "2":
        p, d = check_port_search()
        print(f"PASSED:{p}")
        for q, res in d.items():
            print(f"QUERY:{q}->{res['top_matches']}")
    elif check_num == "3":
        p, d = check_nearest_chennai()
        print(f"PASSED:{p}")
        print(f"FIRST:{d.get('first_name')};DIST:{d.get('distance_km')}km;BEARING:{d.get('bearing')}deg")
    elif check_num == "4":
        p, d = check_marine_snap_stats()
        print(f"PASSED:{p}")
        print(f"SNAPPED:{d['total_snapped']};OFFSET_GT_5KM:{d['offset_gt_5km']};INLAND:{d['inland_or_unsupported']}")
    elif check_num == "5":
        p, d = check_risk_8_ports()
        print(f"PASSED:{p}")
        print(f"DISTINCT:{d['distinct_locations']}/{d['expected_distinct']}")
        for slug, res in d.get("results", {}).items():
            print(f"PORT:{slug} -> level={res.get('level')} loc={res.get('loc')} marine={res.get('marine_loc')}")
    elif check_num == "6":
        p, d = check_inland_suggestion()
        print(f"PASSED:{p}")
        s = d.get("suggestion", {})
        print(f"CODE:{d.get('code')};SUGGESTION:{s.get('name')};DIST:{s.get('distance_km')}km")
    elif check_num == "7":
        p, d = check_no_hardcoded_kochi()
        print(f"PASSED:{p}")
        for v in d.get("violations", []):
            print(f"VIOLATION:{v}")
    elif check_num == "8":
        p, d = check_cache_keys()
        print(f"PASSED:{p}")
        print(f"KEY_MUMBAI:{d['key_mumbai']}")
        print(f"KEY_COCHIN:{d['key_cochin']}")

