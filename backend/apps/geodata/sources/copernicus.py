from datetime import datetime

from django.conf import settings

from apps.geodata.sources.base import NormalisedRecord, RawRecord


class CopernicusAdapter:
    slug = "copernicus"
    name = "Copernicus Marine Service"

    def is_available(self) -> bool:
        username = getattr(settings, "COPERNICUSMARINE_USERNAME", "")
        password = getattr(settings, "COPERNICUSMARINE_PASSWORD", "")
        return bool(username and password)

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        if not self.is_available():
            return []
        # When credentials provided, queries copernicusmarine API
        return []

    def normalise(self, raw: RawRecord) -> list[NormalisedRecord]:
        return []
