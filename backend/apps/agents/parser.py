"""Rule-based natural language understanding and place resolution engine for ORCA.

Part C: Operates with ZERO API keys.
Resolves places, target time windows, vessel classes, and tasks from maritime user queries.
"""

import difflib
import re
from datetime import UTC, datetime, time as dtime, timedelta
import zoneinfo
import structlog
from django.utils import timezone

from apps.agents.glossary import lookup_glossary_term
from apps.agents.schemas import (
    ClarificationOption,
    ClarificationRequest,
    Intent,
    PlaceRef,
    TimeWindow,
)
from apps.ports.models import Port
from apps.ports.normalisation import to_ascii

logger = structlog.get_logger(__name__)

# Common typos, aliases, and transliterations mapped to canonical port search stems
COMMON_TRANSLITERATIONS: dict[str, str] = {
    "kochii": "kochi",
    "cochin": "kochi",
    "mumbay": "mumbai",
    "bombay": "mumbai",
    "chenai": "chennai",
    "madras": "chennai",
    "vizag": "vishakhapatnam",
    "visakh": "vishakhapatnam",
    "visakhapatnam": "vishakhapatnam",
    "vishakapatnam": "vishakhapatnam",
    "tuticorin": "tuticorin",
    "thoothukudi": "tuticorin",
    "mangaluru": "new-mangalore",
    "mangalore": "new-mangalore",
    "port blaire": "port blair",
    "blaire": "port blair",
    "blair": "port blair",
    "calicut": "kozhikode",
    "beypore": "beypore",
    "quilon": "kollam",
    "kollam": "kollam",
    "alleppey": "kayamkulam-fishing-harbour",
    "alappuzha": "kayamkulam-fishing-harbour",
    "diu": "vanakbara-fishing-harbour",
    "trivandrum": "thiruvananthapuram",
    "vizhinjam": "vizhinjam",
    "veraval": "veraval",
    "porbandar": "porbandar",
    "kandla": "kandla",
    "mundra": "mundra",
    "daman": "moti-daman-fishing-jetty",
    "paradip": "paradip",
    "dhamra": "dhamra",
    "haldia": "haldia",
    "kolkata": "calcutta",
    "calcutta": "calcutta",
}

# Out-of-scope and prompt-injection triggers
OUT_OF_SCOPE_PATTERNS = [
    r"\b(steer|heading|course to steer|autopilot|gps route|waypoint)\b",
    r"\b(medical|prescription|sickness pill|medicine|doctor|injury)\b",
    r"\b(lawyer|legal advice|maritime claim|sue|court)\b",
    r"\b(hack|jailbreak|ignore previous|ignore all rules|system prompt|bypass)\b",
    r"\b(tell me it is safe|promise me|guarantee safety|force safe)\b",
]


_INDIAN_PORTS_CACHE: list[Port] | None = None
_PORT_MAP_CACHE: dict[str, Port] | None = None


def _get_port_maps() -> tuple[list[Port], dict[str, Port]]:
    """Loads and caches Indian coastal ports in memory for sub-millisecond lookups."""
    global _INDIAN_PORTS_CACHE, _PORT_MAP_CACHE
    if _PORT_MAP_CACHE is None:
        _INDIAN_PORTS_CACHE = list(Port.objects.filter(country_code="IN"))
        _PORT_MAP_CACHE = {}
        for p in _INDIAN_PORTS_CACHE:
            _PORT_MAP_CACHE[p.slug.lower()] = p
            _PORT_MAP_CACHE[to_ascii(p.name).lower()] = p
            _PORT_MAP_CACHE[p.name_ascii.lower()] = p
            for alt in p.alt_names:
                _PORT_MAP_CACHE[to_ascii(alt).lower()] = p
                _PORT_MAP_CACHE[alt.lower()] = p
    return _INDIAN_PORTS_CACHE, _PORT_MAP_CACHE


def resolve_port_from_db(search_term: str) -> tuple[Port | None, float, list[ClarificationOption]]:
    """
    Resolves a search term against the Port database using:
    1. Instant exact slug / name / alias dictionary match
    2. Transliteration dictionary match
    3. Fuzzy string matching with documented threshold 0.65
    """
    clean_term = search_term.strip().lower()
    clean_ascii = to_ascii(clean_term)
    mapped_stem = COMMON_TRANSLITERATIONS.get(clean_ascii, clean_ascii)

    all_ports, port_map = _get_port_maps()

    # 1. Exact match via dictionary (slug, name, alias, transliteration)
    for candidate in [clean_term, mapped_stem, f"{mapped_stem}-in", f"{clean_term}-in"]:
        if candidate in port_map:
            return port_map[candidate], 1.0, []

    # 2. Fuzzy matching across cached Indian coastal ports
    candidates: list[tuple[Port, float]] = []

    for port in all_ports:
        scores = [
            difflib.SequenceMatcher(None, mapped_stem, to_ascii(port.name).lower()).ratio(),
            difflib.SequenceMatcher(None, mapped_stem, port.name_ascii.lower()).ratio(),
        ]
        p_name = to_ascii(port.name).lower()
        if p_name.startswith(mapped_stem) or mapped_stem in p_name:
            scores.append(0.85)

        for alt in port.alt_names:
            alt_clean = to_ascii(alt).lower()
            scores.append(difflib.SequenceMatcher(None, mapped_stem, alt_clean).ratio())
            if alt_clean.startswith(mapped_stem) or mapped_stem in alt_clean:
                scores.append(0.85)

        max_score = max(scores)
        if max_score >= 0.65:
            candidates.append((port, max_score))

    if not candidates:
        return None, 0.0, []

    candidates.sort(key=lambda x: x[1], reverse=True)
    best_port, best_score = candidates[0]

    # Check for ambiguity: if 2nd candidate is within 0.05 of best_score
    if len(candidates) > 1 and (best_score - candidates[1][1]) < 0.05:
        # Distinct ports only
        seen_slugs = set()
        options = []
        for port, score in candidates[:4]:
            if port.slug in seen_slugs:
                continue
            seen_slugs.add(port.slug)
            options.append(
                ClarificationOption(
                    name=port.name,
                    slug=port.slug,
                    state=port.admin1_name,
                    country=port.country_code,
                    lat=round(port.lat, 4),
                    lon=round(port.lon, 4),
                    distance_hint=f"{port.admin1_name or port.country_code}",
                )
            )
        return None, best_score, options

    return best_port, best_score, []


def extract_places(
    query_text: str, default_location: dict | None = None
) -> tuple[list[PlaceRef], ClarificationRequest | None]:
    """
    Extracts geographic locations from the user query.
    Detects comparisons (e.g. 'compare Kochi and Mangalore') or single places.
    """
    q_lower = query_text.lower()
    
    STOPWORDS = {
        "safe", "safety", "boat", "craft", "wave", "waves", "wind", "weather",
        "going", "tomorrow", "morning", "night", "today", "forecast", "report",
        "fishing", "zone", "zones", "should", "could", "would", "about", "near",
        "tell", "much", "many", "give", "please", "venture", "differ", "between",
        "hours", "days", "week", "month", "what", "which", "does", "mean", "system",
        "rule", "rules", "override", "pills", "medicine", "route", "heading", "steer",
        "legal", "advice", "court", "hull", "there", "this", "that", "rough", "roughness",
        "cyclone", "alert", "alerts", "warnings", "warning", "speed", "gust", "gusts",
        "rainfall", "rain", "temperature", "swell", "steepness", "beaufort", "differ",
        "differing", "compare", "conditions", "right", "where", "best", "good", "spots",
        "station", "points", "seas", "water", "waters", "harbour", "harbor", "port",
        # Hindi / Romanized stopwords to prevent false-positive matches (e.g. 'kal' -> Kalyan)
        "kal", "aaj", "parso", "subah", "shaam", "raat", "jaana", "jana", "kya", "hai",
        "kaisa", "kaise", "hoga", "hogi", "batao", "liye", "pakadne", "pakad", "me"
    }

    # Check for comparison patterns: 'compare X and Y' or 'between X and Y'
    compare_match = re.search(
        r"(?:compare|between)\s+(?:conditions\s+)?(?:waves\s+)?(?:weather\s+)?(?:between\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:and|with|to|vs)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)",
        q_lower,
    )
    extracted_terms: list[str] = []

    if compare_match:
        for raw_term in [compare_match.group(1).strip(), compare_match.group(2).strip()]:
            clean_words = [w for w in raw_term.split() if w not in STOPWORDS]
            if clean_words:
                term = " ".join(clean_words)
                if term not in extracted_terms:
                    extracted_terms.append(term)
    else:
        # First, scan for known transliterations / port aliases directly in q_lower (e.g. "port blaire", "new mangalore", "moti daman")
        for alias in sorted(COMMON_TRANSLITERATIONS.keys(), key=len, reverse=True):
            if re.search(r"\b" + re.escape(alias) + r"\b", q_lower):
                extracted_terms.append(alias)

        # Check 'near X', 'off X', 'in X', 'at X', 'from X'
        preposition_match = re.findall(r"(?:near|off|around|in|at|from|for)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)", q_lower)
        if preposition_match:
            for p in preposition_match:
                if p not in extracted_terms:
                    extracted_terms.append(p)
        
        # Also check candidate words/tokens
        tokens = [t for t in re.findall(r"[a-zA-Z]{3,}", q_lower) if t not in STOPWORDS]
        for t in tokens:
            if t not in extracted_terms:
                extracted_terms.append(t)

    places: list[PlaceRef] = []
    ambiguous_options: list[ClarificationOption] = []

    for term in extracted_terms:
        port, score, options = resolve_port_from_db(term)
        if options and not places:
            ambiguous_options.extend(options)
            continue
        if port:
            if not any(p.port_slug == port.slug for p in places):
                places.append(
                    PlaceRef(
                        text=port.name,
                        port_slug=port.slug,
                        lat=port.lat,
                        lon=port.lon,
                        confidence=round(score, 2),
                    )
                )

    if ambiguous_options:
        return places, ClarificationRequest(
            reason="ambiguous_place",
            options=ambiguous_options[:4],
            message="Multiple coastal locations match your inquiry. Please select the intended port:",
        )

    if not places and default_location and "lat" in default_location and "lon" in default_location:
        places.append(
            PlaceRef(
                text=default_location.get("name", "Current Location"),
                port_slug=default_location.get("slug"),
                lat=float(default_location["lat"]),
                lon=float(default_location["lon"]),
                confidence=1.0,
            )
        )

    return places, None


def parse_window(query_text: str, tz_name: str = "Asia/Kolkata") -> tuple[TimeWindow, ClarificationRequest | None]:
    """
    Parses relative dates and time windows relative to user's timezone.
    Enforces maximum 7-day forecast limit (Part C2).
    """
    try:
        user_tz = zoneinfo.ZoneInfo(tz_name)
    except Exception:
        user_tz = zoneinfo.ZoneInfo("Asia/Kolkata")

    now = datetime.now(user_tz)
    q_lower = query_text.lower()

    # Check for requests beyond 7 days (e.g. "next month", "in 2 weeks", "in 10 days")
    days_match = re.search(r"in\s+(\d+)\s+days", q_lower)
    if days_match:
        num_days = int(days_match.group(1))
        if num_days > 7:
            return TimeWindow(), ClarificationRequest(
                reason="unsupported_window",
                message=f"Forecasts are only available up to 7 days ahead. A window of {num_days} days is outside our verified data horizon.",
            )
        target_day = now + timedelta(days=num_days)
        start = target_day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = target_day.replace(hour=23, minute=59, second=59, microsecond=0)
        return TimeWindow(
            start=start.astimezone(UTC),
            end=end.astimezone(UTC),
            label=f"in {num_days} days",
        ), None

    if any(p in q_lower for p in ["next month", "in 2 weeks", "in two weeks", "in 10 days", "in 14 days"]):
        return TimeWindow(), ClarificationRequest(
            reason="unsupported_window",
            message="Forecasts are only available up to 7 days ahead. Please select a time window within the coming week.",
        )

    # Relative time expressions
    # Tomorrow morning/afternoon/night/day
    if "tomorrow morning" in q_lower or ("kal subah" in q_lower):
        t_day = now + timedelta(days=1)
        start = t_day.replace(hour=6, minute=0, second=0, microsecond=0)
        end = t_day.replace(hour=12, minute=0, second=0, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="tomorrow morning"), None

    if "tomorrow afternoon" in q_lower or ("kal dopahar" in q_lower):
        t_day = now + timedelta(days=1)
        start = t_day.replace(hour=12, minute=0, second=0, microsecond=0)
        end = t_day.replace(hour=18, minute=0, second=0, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="tomorrow afternoon"), None

    if "tomorrow night" in q_lower or ("kal raat" in q_lower):
        t_day = now + timedelta(days=1)
        start = t_day.replace(hour=18, minute=0, second=0, microsecond=0)
        end = t_day.replace(hour=23, minute=59, second=59, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="tomorrow night"), None

    if "day after tomorrow" in q_lower or "parso" in q_lower:
        t_day = now + timedelta(days=2)
        start = t_day.replace(hour=6, minute=0, second=0, microsecond=0)
        end = t_day.replace(hour=18, minute=0, second=0, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="day after tomorrow"), None

    if "tomorrow" in q_lower or "kal" in q_lower:
        t_day = now + timedelta(days=1)
        start = t_day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = t_day.replace(hour=23, minute=59, second=59, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="tomorrow"), None

    if "this morning" in q_lower or "aaj subah" in q_lower:
        start = now.replace(hour=6, minute=0, second=0, microsecond=0)
        end = now.replace(hour=12, minute=0, second=0, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="this morning"), None

    if "this afternoon" in q_lower:
        start = now.replace(hour=12, minute=0, second=0, microsecond=0)
        end = now.replace(hour=18, minute=0, second=0, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="this afternoon"), None

    if "tonight" in q_lower or "aaj raat" in q_lower:
        start = now.replace(hour=18, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="tonight"), None

    if "this weekend" in q_lower:
        days_until_sat = (5 - now.weekday()) % 7
        sat = now + timedelta(days=days_until_sat)
        start = sat.replace(hour=0, minute=0, second=0, microsecond=0)
        sun = sat + timedelta(days=1)
        end = sun.replace(hour=23, minute=59, second=59, microsecond=0)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label="this weekend"), None

    # Specific hours range: "from 5 am to 11 am"
    hour_match = re.search(r"from\s+(\d{1,2})\s*(am|pm)\s+to\s+(\d{1,2})\s*(am|pm)", q_lower)
    if hour_match:
        h1 = int(hour_match.group(1)) + (12 if hour_match.group(2) == "pm" and int(hour_match.group(1)) < 12 else 0)
        h2 = int(hour_match.group(3)) + (12 if hour_match.group(4) == "pm" and int(hour_match.group(3)) < 12 else 0)
        start = now.replace(hour=h1, minute=0, second=0, microsecond=0)
        end = now.replace(hour=h2, minute=0, second=0, microsecond=0)
        if end <= start:
            end += timedelta(days=1)
        return TimeWindow(start=start.astimezone(UTC), end=end.astimezone(UTC), label=f"from {hour_match.group(1)}{hour_match.group(2)} to {hour_match.group(3)}{hour_match.group(4)}"), None

    # Default window: next 12 hours
    default_end = now + timedelta(hours=12)
    return TimeWindow(
        start=now.astimezone(UTC),
        end=default_end.astimezone(UTC),
        label="next 12 hours",
    ), None


def parse_vessel_class(query_text: str, user_default: str | None = None) -> tuple[str, bool]:
    """
    Parses vessel class from words:
    - canoe, catamaran, kattumaram, small boat, country boat, fibre boat, outboard, dinghy -> small_craft
    - trawler, mechanised, gillnetter, purse seiner, large boat -> mechanised
    If absent, uses user_default or defaults to small_craft, noting that it was assumed.
    """
    q_lower = query_text.lower()
    
    small_keywords = [
        "canoe", "catamaran", "kattumaram", "small boat", "country boat",
        "fibre boat", "frp", "outboard", "dinghy", "small craft", "artisanal"
    ]
    mechanised_keywords = [
        "trawler", "mechanised", "mechanized", "gillnetter", "purse seiner",
        "large boat", "inboard", "longliner", "deep sea"
    ]

    for kw in small_keywords:
        if kw in q_lower:
            return "small_craft", False

    for kw in mechanised_keywords:
        if kw in q_lower:
            return "mechanised", False

    if user_default in ("small_craft", "mechanised"):
        return user_default, False

    return "small_craft", True


def parse_task(query_text: str) -> tuple[str, str | None]:
    """
    Transparent keyword and pattern scorer to classify user inquiry task.
    Returns: (task_name, term_for_glossary_if_any)
    """
    q_lower = query_text.lower()

    # Out of scope / adversarial injection checks
    for pat in OUT_OF_SCOPE_PATTERNS:
        if re.search(pat, q_lower):
            return "other", None

    # Glossary lookup check (Part C5) - only for definitional queries
    is_definition_query = any(p in q_lower for p in ["what is", "what does", "define", "explain", "meaning of", "tell me what"])
    if is_definition_query:
        glossary_entry = lookup_glossary_term(query_text)
        if glossary_entry:
            return "explain_term", glossary_entry["term"]

    # Comparison task
    if any(w in q_lower for w in ["compare", "vs", "which is calmer", "which is safer", "which is better"]):
        return "compare", None

    # Safety checks that mention fishing or "safe hai"
    if any(w in q_lower for w in ["fishing safe", "safe to fish", "safe for fishing", "jaana safe", "fishing safe hai", "machli safe"]):
        return "safety", None

    # Advisories / warnings
    if any(w in q_lower for w in ["cyclone", "warning", "warnings", "advisory", "advisories", "alert", "alerts", "bulletin", "storm warning"]):
        return "advisories", None

    # Waves / swell (must match wave conditions or swell before generic safety/weather)
    if any(w in q_lower for w in ["wave height", "wave conditions", "wave forecast", "how rough", "roughness", "waves", "wave", "swell", "sea state"]):
        return "waves", None

    # Fishing zones
    if any(w in q_lower for w in [
        "fishing zone", "fishing spots", "where to fish", "fish catch", "pfz", "potential fishing",
        "good catch", "machhli", "machli", "meen", "fishing"
    ]):
        return "fishing_zones", None

    # Meteorological weather
    if any(w in q_lower for w in ["weather", "wind", "rain", "rainfall", "temperature", "forecast", "gust", "gusts"]):
        return "weather", None

    # Safety (core task)
    if any(w in q_lower for w in [
        "safe", "safety", "can i go", "should i go", "can we go", "venture out",
        "setting sail", "go out", "jaana safe", "danger", "safe hai", "sea conditions"
    ]):
        return "safety", None

    return "safety", None


def parse_intent(query_text: str, context: dict | None = None) -> Intent:
    """
    Main entry point for rule-based natural language understanding (Part C).
    Extracts structured Intent from query text, incorporating previous turn context if present.
    """
    ctx = context or {}
    prev_intent: Intent | None = None
    if "previous_intent" in ctx and isinstance(ctx["previous_intent"], dict):
        try:
            prev_intent = Intent(**ctx["previous_intent"])
        except Exception:
            prev_intent = None

    task, term = parse_task(query_text)

    # If general inquiry or out-of-scope, no place resolution is needed
    if task in ("other", "explain_term"):
        return Intent(
            task=task,
            places=[],
            window=TimeWindow(),
            term=term,
        )

    places, clarification = extract_places(query_text, default_location=ctx.get("location"))

    # If no place in query, but previous intent has a place, carry it over (Follow-up Part F1)
    if not places and prev_intent and prev_intent.places:
        places = prev_intent.places

    # Target window
    window, window_clarification = parse_window(query_text)
    if window_clarification:
        return Intent(
            task=task,
            places=places,
            window=window,
            needs_clarification=window_clarification,
        )

    # If window is default (next 12 hours) and previous intent had a non-default window and query didn't specify time, carry it over
    if window.label == "next 12 hours" and prev_intent and prev_intent.window and prev_intent.window.label != "next 12 hours":
        # Check if query mentioned any time words
        if not any(w in query_text.lower() for w in ["today", "tomorrow", "now", "tonight", "morning", "afternoon"]):
            window = prev_intent.window

    # Vessel class
    user_default = ctx.get("vessel_class") or (prev_intent.vessel_class if prev_intent else None)
    vessel_class, assumed = parse_vessel_class(query_text, user_default=user_default)

    # Unit preference
    units = "knots" if "knot" in query_text.lower() else ("metric" if "km/h" in query_text.lower() or "meter" in query_text.lower() else None)
    if units is None and prev_intent:
        units = prev_intent.units

    # If place is required for the task but missing, trigger clarification
    if not places and task in ("safety", "fishing_zones", "weather", "waves", "advisories", "compare"):
        clarification = ClarificationRequest(
            reason="no_place",
            message="Please specify which coastal port or location you would like an evaluation for.",
            options=[],
        )

    return Intent(
        task=task,
        places=places,
        window=window,
        vessel_class=vessel_class,
        units=units,
        language="en",
        needs_clarification=clarification,
        term=term,
        assumed_vessel_class=assumed,
    )
