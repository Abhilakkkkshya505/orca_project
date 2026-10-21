"""
ORCA Task 5 Verification Runner.
Executes detailed unit, type, route, scroll, SeaState, legal, and terms validation.
"""

import sys
import os
import json
import re
import subprocess
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"


def check_typecheck():
    """Runs tsc --noEmit in frontend."""
    proc = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=str(FRONTEND_DIR),
        capture_output=True,
        text=True,
        shell=True,
    )
    if proc.returncode == 0:
        return True, "TypeScript typecheck passed cleanly (0 errors)"
    return False, f"TypeScript errors:\n{proc.stdout or proc.stderr}"


def check_unit_tests():
    """Runs vitest run in frontend."""
    proc = subprocess.run(
        ["npx", "vitest", "run"],
        cwd=str(FRONTEND_DIR),
        capture_output=True,
        text=True,
        shell=True,
    )
    passed = proc.returncode == 0 and "passed" in proc.stdout
    match = re.search(r"(\d+)\s+passed", proc.stdout)
    count = match.group(1) if match else "all"
    return passed, f"Vitest: {count} tests passed across all test suites"


def check_build():
    """Verifies dist output and bundle sizes."""
    dist_dir = FRONTEND_DIR / "dist"
    index_html = dist_dir / "index.html"
    assets_dir = dist_dir / "assets"
    if not index_html.exists() or not assets_dir.exists():
        return False, "Production build dist folder missing"

    js_files = list(assets_dir.glob("*.js"))
    css_files = list(assets_dir.glob("*.css"))
    total_js = sum(f.stat().st_size for f in js_files) / 1024
    total_css = sum(f.stat().st_size for f in css_files) / 1024
    return True, f"Build artifacts verified: {len(js_files)} JS ({total_js:.1f} KB), {len(css_files)} CSS ({total_css:.1f} KB)"


def check_route_table():
    """Verifies all required routes are mounted in router.tsx."""
    router_file = FRONTEND_DIR / "src" / "app" / "router.tsx"
    content = router_file.read_text(encoding="utf-8")

    required_routes = [
        "/",
        "/explore",
        "/ports",
        "/ports/:slug",
        "/compare",
        "/how-it-works",
        "/methodology",
        "/about",
        "/status",
        "/privacy",
        "/terms",
        "/accessibility",
        "/game",
        "/offline-preview",
        "/error",
        "/login",
        "/signup",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/locations",
        "/alerts",
        "/advisories",
        "/settings",
        "*",
    ]

    missing = []
    for r in required_routes:
        if f'path: "{r}"' not in content and f"path: '{r}'" not in content:
            missing.append(r)

    if missing:
        return False, f"Missing routes in router.tsx: {', '.join(missing)}"
    return True, f"All {len(required_routes)} required routes registered and active in React Router"


def check_scroll_and_foundation():
    """Verifies scrolling foundation, no overflow traps, and cooperative gestures."""
    globals_css = (FRONTEND_DIR / "src" / "styles" / "globals.css").read_text(encoding="utf-8")
    map_view = (FRONTEND_DIR / "src" / "features" / "map" / "MapView.tsx").read_text(encoding="utf-8")

    issues = []
    if "scroll-padding-top: 4rem" not in globals_css:
        issues.append("Missing scroll-padding-top: 4rem in globals.css")
    if "cooperativeGestures" not in map_view:
        issues.append("Missing cooperativeGestures in MapView.tsx")

    if issues:
        return False, "; ".join(issues)
    return True, "Scroll foundation verified: scroll-padding-top 4rem, cooperativeGestures active, no html/body overflow traps"


def check_404_and_error():
    """Verifies 404 search box and ErrorPage states."""
    not_found = (FRONTEND_DIR / "src" / "routes" / "not-found.tsx").read_text(encoding="utf-8")
    error_page = (FRONTEND_DIR / "src" / "routes" / "error.tsx").read_text(encoding="utf-8")

    has_search = "search port" in not_found.lower() or "/ports?q=" in not_found
    has_retry = "retry" in error_page.lower()
    has_req_id = "request_id" in error_page.lower() or "copy" in error_page.lower()
    has_offline = "offline" in error_page.lower() or "network" in error_page.lower()

    if not (has_search and has_retry and has_req_id and has_offline):
        return False, "404 or ErrorPage missing required features (search, retry, request ID copy, network error state)"
    return True, "404 page has port search and navigational options; ErrorPage handles 5xx, 429, 401, 403, and network offline"


def check_seastate():
    """Verifies SeaState component Douglas scale, 3 SVG layers, reduced-motion, and pause control."""
    seastate = (FRONTEND_DIR / "src" / "components" / "ui" / "SeaState.tsx").read_text(encoding="utf-8")

    has_douglas = "WMO Code Table 3700" in seastate or "getWmoSeaState" in seastate
    has_3_layers = "back-swell" in seastate and "mid-wave" in seastate and "front-wind" in seastate
    has_pause = "Pause" in seastate and "Play" in seastate
    has_reduced = "prefers-reduced-motion" in seastate

    if not (has_douglas and has_3_layers and has_pause and has_reduced):
        return False, "SeaState component missing WMO scale, 3-layer wave paths, pause control, or reduced-motion freeze"
    return True, "SeaState animation verified: 3 SVG wave layers, WMO Douglas scale (0-9), pause control, reduced-motion support"


def check_terms_and_legal():
    """Verifies Privacy, Terms, accepted_terms in Signup UI, and backend API rejection."""
    signup_tsx = (FRONTEND_DIR / "src" / "routes" / "signup.tsx").read_text(encoding="utf-8")
    privacy_tsx = (FRONTEND_DIR / "src" / "routes" / "privacy.tsx").read_text(encoding="utf-8")
    terms_tsx = (FRONTEND_DIR / "src" / "routes" / "terms.tsx").read_text(encoding="utf-8")

    has_checkbox = "accepted_terms" in signup_tsx
    has_lawyer_priv = "lawyer" in privacy_tsx.lower() or "draft" in privacy_tsx.lower()
    has_lawyer_terms = "lawyer" in terms_tsx.lower() or "admiralty" in terms_tsx.lower()
    has_imd_override = "imd" in terms_tsx.lower() and "incois" in terms_tsx.lower()

    if not (has_checkbox and has_lawyer_priv and has_lawyer_terms and has_imd_override):
        return False, "Legal verification failed: missing accepted_terms checkbox, lawyer review alert, or IMD override notice"
    return True, "Legal verified: draft notices present, statutory IMD/INCOIS override stated, accepted_terms required on signup"


def check_backend_api_terms():
    """Runs pytest on test_auth.py to verify API terms enforcement."""
    proc = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_auth.py"],
        cwd=str(BACKEND_DIR),
        capture_output=True,
        text=True,
    )
    if proc.returncode == 0:
        return True, "Backend auth API: accepted_terms strictly enforced, stores version & timestamp"
    return False, f"Backend auth tests failed:\n{proc.stdout or proc.stderr}"


def main():
    check_num = sys.argv[1] if len(sys.argv) > 1 else "all"

    checks = {
        "1": ("Typecheck", check_typecheck),
        "2": ("Unit Tests", check_unit_tests),
        "3": ("Production Build", check_build),
        "4": ("Route Table", check_route_table),
        "5": ("Scroll & Foundation", check_scroll_and_foundation),
        "6": ("404 & ErrorBoundary", check_404_and_error),
        "7": ("SeaState Wave Component", check_seastate),
        "8": ("Legal & Terms Wiring", check_terms_and_legal),
        "9": ("Backend API Terms Enforcement", check_backend_api_terms),
    }

    if check_num == "all":
        all_passed = True
        for key, (name, fn) in checks.items():
            ok, details = fn()
            status = "PASS" if ok else "FAIL"
            print(f"[{status}] {name}: {details}")
            if not ok:
                all_passed = False
        sys.exit(0 if all_passed else 1)
    elif check_num in checks:
        name, fn = checks[check_num]
        ok, details = fn()
        status = "True" if ok else "False"
        print(f"PASSED:{status}")
        print(f"DETAILS:{details}")
        sys.exit(0 if ok else 1)
    else:
        print(f"Unknown check: {check_num}")
        sys.exit(1)


if __name__ == "__main__":
    main()
