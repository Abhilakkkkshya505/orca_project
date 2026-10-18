from datetime import datetime

from apps.geodata.sources.base import NormalisedRecord, RawRecord


class INCOISAdapter:
    slug = "incois"
    name = "INCOIS Marine Bulletins & Advisories"

    def is_available(self) -> bool:
        return True

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        # INCOIS bulletins are ingested via scheduled scraper tasks or manual admin entry
        return []

    def normalise(self, raw: RawRecord) -> list[NormalisedRecord]:
        return []
