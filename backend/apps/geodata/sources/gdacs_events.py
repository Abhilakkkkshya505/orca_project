"""
GDACS Hazard Events Adapter (slug: gdacs_events).
Pulls active tropical cyclone, tsunami, and marine hazard alerts from the Global Disaster
Alert and Coordination System (GDACS - UN-OCHA & European Commission).
Severity mapping:
- Green  -> info
- Orange -> warning
- Red    -> severe
Attribution: Global Disaster Alert and Coordination System (GDACS - UN-OCHA & European Commission).
Notice: Labelled as "Third-party hazard alert (GDACS)", NOT an Indian official advisory.
"""

from datetime import datetime, timedelta, timezone
from typing import Any
import requests
import structlog
from django.utils import timezone as dj_timezone

from apps.geodata.models import Advisory, DataSource
from apps.geodata.sources.base import BaseAdapter, RawRecord

logger = structlog.get_logger(__name__)

GDACS_EVENTS_GEOJSON_URL = "https://www.gdacs.org/datareport/resources/TC/events.geojson"
GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml"
ATTRIBUTION_TEXT = "Global Disaster Alert and Coordination System (GDACS - UN-OCHA & European Commission)."


class GdacsEventsAdapter(BaseAdapter):
    slug = "gdacs_events"
    name = "GDACS Global Hazards"
    attribution = ATTRIBUTION_TEXT
    timeout_seconds = 10.0

    def fetch(self, lat: float = 0.0, lon: float = 0.0, since: datetime | None = None) -> list[RawRecord]:
        """Fetches active disaster alert events from GDACS."""
        issued_at = datetime.now(timezone.utc)

        def _do_get():
            resp = requests.get(GDACS_EVENTS_GEOJSON_URL, timeout=self.timeout_seconds)
            resp.raise_for_status()
            return resp.json()

        try:
            data = self._execute_with_retry(_do_get)
            return [
                RawRecord(
                    source_slug=self.slug,
                    lat=lat,
                    lon=lon,
                    issued_at=issued_at,
                    data=data,
                )
            ]
        except Exception as e:
            self.record_error(str(e))
            logger.warning("gdacs_events_fetch_failed", error=str(e))
            return []

    def ingest_events(self, raw_data: dict[str, Any], dry_run: bool = False) -> int:
        """
        Parses GeoJSON features into Advisory model rows.
        Maps alert level (Green->info, Orange->warning, Red->severe).
        """
        features = raw_data.get("features", [])
        if not features:
            return 0

        source_obj, _ = DataSource.objects.get_or_create(
            slug=self.slug,
            defaults={"name": self.name, "is_enabled": True},
        )

        saved = 0
        now = dj_timezone.now()

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [0.0, 0.0])

            event_id = str(props.get("eventid") or props.get("id") or "gdacs-unknown")
            event_name = props.get("eventname") or props.get("name") or "Tropical Cyclone"
            alert_level = str(props.get("alertlevel", "Green")).lower()

            if alert_level == "red":
                severity = Advisory.SeverityChoice.SEVERE
            elif alert_level == "orange":
                severity = Advisory.SeverityChoice.WARNING
            else:
                severity = Advisory.SeverityChoice.INFO

            headline = f"Third-party hazard alert (GDACS): {event_name} [{alert_level.upper()}]"
            body = (
                f"GDACS automated bulletin: {props.get('htmldescription') or event_name}. "
                "Notice: This is a third-party global hazard alert, NOT an official IMD/INCOIS advisory."
            )

            # Spatial bounds: point +/- 3 degrees buffer (~330km)
            event_lon = float(coords[0]) if len(coords) > 0 else 0.0
            event_lat = float(coords[1]) if len(coords) > 1 else 0.0
            min_lat = event_lat - 3.0
            max_lat = event_lat + 3.0
            min_lon = event_lon - 3.0
            max_lon = event_lon + 3.0

            from_date_str = props.get("fromdate")
            to_date_str = props.get("todate")
            try:
                issued_at = datetime.fromisoformat(from_date_str.replace("Z", "+00:00")) if from_date_str else now
            except Exception:
                issued_at = now

            try:
                expires_at = datetime.fromisoformat(to_date_str.replace("Z", "+00:00")) if to_date_str else now + timedelta(days=3)
            except Exception:
                expires_at = now + timedelta(days=3)

            source_url = props.get("url") or f"https://www.gdacs.org/report.aspx?eventid={event_id}"
            content_hash = Advisory.compute_content_hash(headline, body, severity)

            if not dry_run:
                Advisory.objects.update_or_create(
                    source=source_obj,
                    external_id=event_id,
                    content_hash=content_hash,
                    defaults={
                        "headline": headline[:255],
                        "body": body,
                        "severity": severity,
                        "min_lat": min_lat,
                        "max_lat": max_lat,
                        "min_lon": min_lon,
                        "max_lon": max_lon,
                        "issued_at": issued_at,
                        "expires_at": expires_at,
                        "source_url": source_url,
                    },
                )
            saved += 1

        self.record_success()
        return saved
