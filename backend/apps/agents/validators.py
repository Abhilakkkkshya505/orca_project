import re

import structlog

logger = structlog.get_logger(__name__)

# Regex to extract isolated floating-point numbers or integers from text
# Ignores ISO dates like 2026-10-18, clock times like 06:00, or HTML/markdown syntax
NUMBER_PATTERN = re.compile(r"(?<![\w\-/:])(?:\d+\.\d+|\d+)(?![\w\-/:])")
TIME_PATTERN = re.compile(r"\b\d{1,2}:\d{2}\b")
YEAR_PATTERN = re.compile(r"\b20\d{2}\b")


def extract_numbers_from_text(text: str) -> list[float]:
    """
    Extracts numerical figures from generated prose,
    ignoring clock times (e.g., 14:00) and calendar years (e.g., 2026).
    """
    # Remove clock times first
    cleaned = TIME_PATTERN.sub(" ", text)
    # Remove years
    cleaned = YEAR_PATTERN.sub(" ", cleaned)

    numbers = []
    for match in NUMBER_PATTERN.findall(cleaned):
        try:
            val = float(match)
            numbers.append(val)
        except ValueError:
            continue
    return numbers


def validate_llm_numbers(
    generated_text: str, allowed_numbers: set[float], tolerance: float = 0.05
) -> tuple[bool, list[float]]:
    """
    Verifies that every numerical assertion in generated_text is grounded in allowed_numbers.
    Returns: (is_valid, list_of_unsupported_numbers)
    """
    extracted = extract_numbers_from_text(generated_text)
    unsupported = []

    for num in extracted:
        # Check if num matches any allowed number within relative tolerance
        matched = False
        for allowed in allowed_numbers:
            if abs(num - allowed) <= tolerance or (allowed != 0 and abs(num - allowed) / abs(allowed) <= tolerance):
                matched = True
                break
        if not matched:
            unsupported.append(num)

    if unsupported:
        logger.warning("llm_validator_rejected_unsupported_numbers", unsupported=unsupported)
        return False, unsupported

    return True, []
