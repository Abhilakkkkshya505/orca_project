"""Tests for LLM number validator and hallucination rejection engine.

Verifies non-negotiable safety rule #3:
LLM text must not contain a number that is not in the structured results.
"""

import pytest

from apps.agents.validators import extract_numbers_from_text, validate_llm_numbers


def test_extract_numbers_basic_and_filtering():
    """Extracts integers and floats while filtering clock times and calendar years."""
    text = "Issued at 14:30 on 2026-10-18: Significant wave height is 1.8 m with 25 km/h gusts."
    nums = extract_numbers_from_text(text)
    # 14:30 and 2026 should be omitted
    assert 1.8 in nums
    assert 25.0 in nums
    assert 2026.0 not in nums


def test_validate_llm_numbers_valid_grounded_text():
    """Valid text with all numbers matching structured results passes validation."""
    allowed = {1.8, 25.0, 9.97, 76.24}
    text = "Conditions near 9.97 N, 76.24 E show 1.8 m waves and gusts up to 25 km/h."
    valid, unsupported = validate_llm_numbers(text, allowed)
    assert valid is True
    assert unsupported == []


def test_validate_llm_numbers_no_numbers():
    """Prose with no numbers passes validation."""
    text = "Conditions are generally calm with safe navigation expected throughout the day."
    valid, unsupported = validate_llm_numbers(text, set())
    assert valid is True
    assert unsupported == []


@pytest.mark.parametrize(
    "hallucinated_text,expected_unsupported",
    [
        (
            "Wave height is 1.8 m with dangerous 88 km/h storm gusts.",
            [88.0],
        ),
        (
            "Fishing zones identified with a score of 95 and wave height 1.8 m.",
            [95.0],
        ),
        (
            "There is a 99% probability of severe cyclone conditions.",
            [99.0],
        ),
        (
            "Tide height reaching 4.2 meters above normal datum.",
            [4.2],
        ),
    ],
)
def test_validate_llm_numbers_adversarial_injections_rejected(hallucinated_text, expected_unsupported):
    """Adversarial hallucinations fabricated by LLM are strictly detected and rejected."""
    allowed = {1.8, 25.0}  # Only 1.8 and 25.0 are valid
    valid, unsupported = validate_llm_numbers(hallucinated_text, allowed)
    assert valid is False
    for exp in expected_unsupported:
        assert any(abs(u - exp) < 0.01 for u in unsupported)


def test_validate_llm_numbers_relative_tolerance():
    """Numbers within small floating point rounding tolerance pass."""
    allowed = {1.833333}
    text = "Estimated wave height is 1.8 m."
    valid, unsupported = validate_llm_numbers(text, allowed, tolerance=0.05)
    assert valid is True
