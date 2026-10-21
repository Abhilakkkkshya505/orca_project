"""Pydantic schemas for ORCA agents, intent extraction, and chat pipeline."""

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class PlaceRef(BaseModel):
    """Reference to a geographic location or port extracted from query."""

    text: str
    port_slug: str | None = None
    lat: float | None = None
    lon: float | None = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TimeWindow(BaseModel):
    """Target time window for maritime forecast and safety evaluation."""

    start: datetime | None = None
    end: datetime | None = None
    label: str | None = None


class ClarificationOption(BaseModel):
    """Clickable option for ambiguous port or location selection."""

    name: str
    slug: str | None = None
    state: str | None = None
    country: str = "IN"
    lat: float | None = None
    lon: float | None = None
    distance_hint: str | None = None


class ClarificationRequest(BaseModel):
    """Payload returned when location is ambiguous, missing, or window is invalid."""

    reason: Literal["ambiguous_place", "no_place", "unsupported_window", "other"]
    options: list[ClarificationOption] = Field(default_factory=list)
    message: str | None = None


class Intent(BaseModel):
    """
    Standard ORCA Intent Schema (Part B).
    Used by rule-based parser and LLM providers.
    """

    task: Literal[
        "safety",
        "fishing_zones",
        "weather",
        "waves",
        "advisories",
        "compare",
        "explain_term",
        "other",
    ] = "safety"
    places: list[PlaceRef] = Field(default_factory=list)
    window: TimeWindow = Field(default_factory=TimeWindow)
    vessel_class: Literal["small_craft", "mechanised"] | None = None
    units: Literal["metric", "knots"] | None = None
    language: str = "en"
    needs_clarification: ClarificationRequest | None = None
    term: str | None = None
    assumed_vessel_class: bool = False
    fallback: bool = False
    fallback_reason: str | None = None


# Backward-compatible classes for existing modules
class QueryContext(BaseModel):
    lat: float
    lon: float
    location_name: str | None = None
    valid_from: datetime
    valid_to: datetime
    vessel_class: str = "small_craft"
    user_units: str = "metric"


class AgentResult(BaseModel):
    agent_name: str
    data: dict[str, Any] = Field(default_factory=dict)
    data_age_hours: float | None = None
    sources: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class IntentExtractionResult(BaseModel):
    location_name: str | None = None
    lat: float | None = None
    lon: float | None = None
    date_str: str | None = None
    vessel_class: str = "small_craft"
    question_type: str = "safety_and_fishing"
