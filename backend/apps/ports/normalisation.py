import math
import re
import unicodedata
from django.utils.text import slugify

# Standard historical / vernacular alternate port names mapping (bidirectional)
KNOWN_PAIRS = [
    ("Kochi", "Cochin"),
    ("Mumbai", "Bombay"),
    ("Chennai", "Madras"),
    ("Kolkata", "Calcutta"),
    ("Visakhapatnam", "Vizag"),
    ("Thoothukudi", "Tuticorin"),
    ("Mangaluru", "Mangalore"),
    ("Thiruvananthapuram", "Trivandrum"),
    ("Puducherry", "Pondicherry"),
    ("Panaji", "Panjim"),
    ("Alappuzha", "Alleppey"),
    ("Kollam", "Quilon"),
    ("Kozhikode", "Calicut"),
    ("Kannur", "Cannanore"),
    ("Thalassery", "Tellicherry"),
    ("Vatakara", "Badagara"),
    ("Valsad", "Bulsar"),
    ("Bharuch", "Broach"),
    ("Khambhat", "Cambay"),
    ("Port Blair", "Sri Vijaya Puram"),
]

ALIAS_MAP: dict[str, list[str]] = {}
for p1, p2 in KNOWN_PAIRS:
    k1 = slugify(p1).replace("-", " ")
    k2 = slugify(p2).replace("-", " ")
    ALIAS_MAP.setdefault(k1, []).append(p2)
    ALIAS_MAP.setdefault(k2, []).append(p1)


def normalize_whitespace(text: str) -> str:
    """Strips leading/trailing whitespace and collapses multiple spaces into one."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip())


def normalize_name(name: str) -> str:
    """Normalizes port name: strips whitespace, collapses spaces, and title-cases."""
    cleaned = normalize_whitespace(name)
    if not cleaned:
        return ""
    # Capitalize words while preserving hyphens and slashes
    parts = re.split(r"(\s+|[-/])", cleaned)
    titled = []
    for p in parts:
        if p.strip() and not re.match(r"^(\s+|[-/])$", p):
            titled.append(p.capitalize())
        else:
            titled.append(p)
    return "".join(titled)


def to_ascii(text: str) -> str:
    """Transliterates text to plain ASCII (lowercase, accents removed)."""
    if not text:
        return ""
    # Normalize unicode to NFKD (decomposes accents from base characters)
    norm = unicodedata.normalize("NFKD", text)
    ascii_bytes = norm.encode("ascii", "ignore")
    return normalize_whitespace(ascii_bytes.decode("utf-8").lower())


def extract_alt_names(main_name: str, raw_alt: str = "") -> list[str]:
    """
    Extracts, cleans, and deduplicates alternate names from WPI columns,
    synonyms, and known historical aliases.
    """
    results: list[str] = []
    seen = {to_ascii(main_name)}

    def add_name(n: str):
        c = normalize_name(n)
        a = to_ascii(c)
        if c and a and a not in seen:
            seen.add(a)
            results.append(c)

    # 1. Parse raw alternate names field (comma, semicolon, or slash separated)
    if raw_alt:
        splits = re.split(r"[,;/]+", raw_alt)
        for s in splits:
            s_clean = normalize_whitespace(s)
            if s_clean:
                add_name(s_clean)

    # 2. Check for parentheses in main name e.g. "Kochi (Cochin)"
    m = re.findall(r"\(([^)]+)\)", main_name)
    for in_paren in m:
        add_name(in_paren)

    # 3. Known historical pairs
    main_ascii = to_ascii(main_name)
    if main_ascii in ALIAS_MAP:
        for alias in ALIAS_MAP[main_ascii]:
            add_name(alias)

    for k, aliases in ALIAS_MAP.items():
        if k in main_ascii or main_ascii in k:
            for alias in aliases:
                add_name(alias)

    return results


def validate_coordinates(lat: float, lon: float) -> tuple[bool, str]:
    """
    Validates geographical coordinates:
    - Rejects Null Island (0, 0)
    - Rejects out of range (lat outside -90..90, lon outside -180..180)
    - Detects swapped coordinates (e.g., latitude > 90 but longitude is within lat range)
    """
    if math.isnan(lat) or math.isnan(lon):
        return False, "NaN coordinate"

    # Null Island check
    if abs(lat) < 1e-4 and abs(lon) < 1e-4:
        return False, "Null Island (0, 0) is rejected as invalid/placeholder"

    # Swapped coordinates check (e.g. lat > 90 and -90 <= lon <= 90)
    if (abs(lat) > 90.0) and (-90.0 <= lon <= 90.0):
        return False, f"Swapped coordinates detected: lat={lat} > 90, lon={lon}"

    if not (-90.0 <= lat <= 90.0):
        return False, f"Latitude {lat} out of range [-90, 90]"

    if not (-180.0 <= lon <= 180.0):
        return False, f"Longitude {lon} out of range [-180, 180]"

    return True, "OK"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers between two points."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def generate_unique_slug(
    name: str,
    country_code: str,
    admin1_name: str = "",
    existing_slugs: set[str] | None = None,
) -> str:
    """
    Generates a unique, human-readable slug according to Part B3:
    1. Base slug: name + country_code (e.g. "mumbai-in", "rotterdam-nl")
    2. If collision: append admin1 (e.g. "port-blair-andaman-in")
    3. If still collision: append integer counter (e.g. "new-port-us-2")
    """
    if existing_slugs is None:
        existing_slugs = set()

    base = slugify(to_ascii(name))
    if not base:
        base = "port"

    cc = (country_code or "xx").lower().strip()
    candidate = f"{base}-{cc}"

    if candidate not in existing_slugs:
        existing_slugs.add(candidate)
        return candidate

    # Collision resolution with admin1
    base_with_adm = None
    if admin1_name:
        adm = slugify(to_ascii(admin1_name))
        base_with_adm = f"{base}-{adm}-{cc}"
        if base_with_adm not in existing_slugs:
            existing_slugs.add(base_with_adm)
            return base_with_adm

    # Counter fallback
    prefix = base_with_adm if base_with_adm else candidate
    idx = 2
    while f"{prefix}-{idx}" in existing_slugs:
        idx += 1

    unique_slug = f"{prefix}-{idx}"
    existing_slugs.add(unique_slug)
    return unique_slug
