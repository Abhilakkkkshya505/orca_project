from datetime import datetime

from pydantic import BaseModel, Field


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
    data: dict = Field(default_factory=dict)
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
