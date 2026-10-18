from datetime import datetime

from django.conf import settings

from apps.geodata.sources.base import NormalisedRecord, RawRecord


class NASAAdapter:
    slug = "nasa_ocean"
    name = "NASA Ocean Color / Earthdata"

    def is_available(self) -> bool:
        token = getattr(settings, "EARTHDATA_TOKEN", "")
        return bool(token)

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        return []

    def normalise(self, raw: RawRecord) -> list[NormalisedRecord]:
        return []
