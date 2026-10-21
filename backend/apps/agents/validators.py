"""Strict numerical anti-hallucination validator for ORCA chat.

Rule S4 & Part D3:
Extracts every number and written-out numeral from generated explanation prose,
normalizes units (km/h vs knots, m vs ft), and verifies that every numerical assertion
is strictly grounded in the structured RiskAssessment data.
"""

import math
import re
import structlog

logger = structlog.get_logger(__name__)

# Regex patterns to isolate numbers while ignoring timestamps, dates, and markdown
NUMBER_PATTERN = re.compile(r"(?<![\w\-/:])(?:\d+\.\d+|\d+)(?![\w\-/:])")
TIME_PATTERN = re.compile(r"\b\d{1,2}:\d{2}\b")
YEAR_PATTERN = re.compile(r"\b20\d{2}\b")

# Written numeral dictionary
WORD_TO_NUMBER = {
    "zero": 0.0,
    "one": 1.0,
    "two": 2.0,
    "three": 3.0,
    "four": 4.0,
    "five": 5.0,
    "six": 6.0,
    "seven": 7.0,
    "eight": 8.0,
    "nine": 9.0,
    "ten": 10.0,
    "eleven": 11.0,
    "twelve": 12.0,
}


def extract_numbers_from_text(text: str) -> list[float]:
    """
    Extracts all numerical assertions from generated text,
    including floating point numbers, integers, and written word numerals.
    Excludes clock times (14:30) and calendar years (2026).
    """
    # 1. Clean clock times and calendar years
    cleaned = TIME_PATTERN.sub(" ", text)
    cleaned = YEAR_PATTERN.sub(" ", cleaned)

    numbers: list[float] = []

    # 2. Extract digits
    for match in NUMBER_PATTERN.findall(cleaned):
        try:
            val = float(match)
            numbers.append(val)
        except ValueError:
            continue

    # 3. Extract word numerals (e.g., 'two metres')
    words = re.findall(r"\b[a-zA-Z]+\b", cleaned.lower())
    for w in words:
        if w in WORD_TO_NUMBER:
            numbers.append(WORD_TO_NUMBER[w])

    return numbers


def build_allowed_numbers_from_assessment(assessment, extra_numbers: set[float] | None = None) -> set[float]:
    """
    Derives the complete set of permitted numbers from a RiskAssessment object,
    including factor values, threshold limits, unit conversions (knots, feet),
    coordinates, advisory counts, and zone scores.
    """
    allowed: set[float] = {0.0, 1.0, 2.0, 3.0, 4.0}  # Basic counts/levels
    if extra_numbers:
        allowed.update(extra_numbers)

    # Coordinates
    lat = getattr(assessment, "lat", None)
    lon = getattr(assessment, "lon", None)
    if lat is not None and lon is not None:
        for val in [float(lat), float(lon)]:
            allowed.add(val)
            allowed.add(round(val, 1))
            allowed.add(round(val, 2))
            allowed.add(round(val, 3))

    offset = getattr(assessment, "marine_offset_km", None)
    if offset is not None:
        allowed.add(float(offset))
        allowed.add(round(float(offset), 1))
        allowed.add(int(round(float(offset))))

    # Factors
    factors = getattr(assessment, "factors", [])
    if isinstance(factors, list):
        for f in factors:
            if not isinstance(f, dict):
                continue
            key = f.get("key", "")
            for field in ["value", "caution_at", "unsafe_at"]:
                v = f.get(field)
                if v is not None:
                    try:
                        fv = float(v)
                        allowed.add(fv)
                        allowed.add(round(fv, 1))
                        allowed.add(round(fv, 2))
                        allowed.add(float(int(round(fv))))

                        # Unit conversions:
                        # If km/h, add knots (fv / 1.852)
                        if "kmh" in key or "speed" in key or "gust" in key:
                            knots = fv / 1.852
                            allowed.add(round(knots, 1))
                            allowed.add(float(int(round(knots))))
                        # If meters, add feet (fv * 3.28084)
                        if "_m" in key or "height" in key or "wave" in key or "swell" in key:
                            feet = fv * 3.28084
                            allowed.add(round(feet, 1))
                            allowed.add(float(int(round(feet))))
                    except (ValueError, TypeError):
                        pass

    # Advisories count
    adv_ids = getattr(assessment, "advisory_ids", [])
    if isinstance(adv_ids, list):
        allowed.add(float(len(adv_ids)))

    # Fishing zones
    zones = getattr(assessment, "fishing_zones", None)
    if zones is not None:
        try:
            for z in zones.all():
                if hasattr(z, "score"):
                    allowed.add(float(z.score))
        except Exception:
            pass

    return allowed


def validate_llm_numbers(
    generated_text: str, allowed_numbers: set[float], tolerance: float = 0.05
) -> tuple[bool, list[float]]:
    """
    Verifies that every numerical assertion in generated_text matches an allowed number
    within an absolute or relative tolerance.
    """
    extracted = extract_numbers_from_text(generated_text)
    unsupported = []

    for num in extracted:
        matched = False
        for allowed in allowed_numbers:
            # Check absolute tolerance (e.g. 0.05) or relative tolerance (5%)
            if abs(num - allowed) <= tolerance:
                matched = True
                break
            if allowed != 0 and (abs(num - allowed) / abs(allowed)) <= tolerance:
                matched = True
                break
        if not matched:
            unsupported.append(num)

    if unsupported:
        logger.warning("chat.validator_rejected", reason=f"Unsupported numbers detected: {unsupported}")
        return False, unsupported

    return True, []


def validate_explanation_numbers(
    generated_text: str, assessment, tolerance: float = 0.05
) -> tuple[bool, str]:
    """
    Convenience wrapper: derives allowed numbers from RiskAssessment and validates text.
    Returns (is_valid, error_reason).
    """
    allowed = build_allowed_numbers_from_assessment(assessment)
    ok, unsupported = validate_llm_numbers(generated_text, allowed, tolerance=tolerance)
    if not ok:
        return False, f"Unsupported numbers detected: {unsupported}"
    return True, ""

