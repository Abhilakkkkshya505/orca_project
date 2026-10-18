from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol


@dataclass
class RawRecord:
    source_slug: str
    lat: float
    lon: float
    issued_at: datetime
    data: dict[str, Any]


@dataclass
class NormalisedRecord:
    source_slug: str
    lat: float
    lon: float
    valid_time: datetime
    issued_at: datetime
    values: dict[str, Any]


class SourceAdapter(Protocol):
    """Protocol for external marine data provider adapters."""

    slug: str
    name: str

    def is_available(self) -> bool:
        """Returns True if the adapter has required credentials or network access."""
        ...

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> Iterable[RawRecord]:
        """Fetches raw data payload from the provider API."""
        ...

    def normalise(self, raw: RawRecord) -> Iterable[NormalisedRecord]:
        """Converts raw data into standardized metric variables."""
        ...
