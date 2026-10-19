"""
Manual Advisories & Permission-Gated Scraper Interface (slug: manual_advisories).
Handles official advisories from IMD, INCOIS, State Fisheries, and Indian Coast Guard.
Includes:
- Helper function to create advisories with port + radius or explicit polygon/bbox
- AuditEntry logging on every creation/edit
- Permission-gated scraper interface (disabled by default; requires owner's written permission)
"""

import csv
from datetime import datetime, timedelta, timezone
from io import StringIO
import math
from typing import Any
import structlog
from django.utils import timezone as dj_timezone

from apps.auditlog.models import log_audit
from apps.geodata.models import Advisory, DataSource
from apps.ports.models import Port

logger = structlog.get_logger(__name__)


def km_to_deg_lat(km: float) -> float:
    return km / 111.0


def km_to_deg_lon(km: float, lat: float) -> float:
    return km / (111.0 * max(0.1, math.cos(math.radians(lat))))


def create_manual_advisory(
    headline: str,
    body: str,
    severity: str,
    issuer: str = "IMD",
    port_slug: str | None = None,
    radius_km: float = 50.0,
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
    issued_at: datetime | None = None,
    expires_at: datetime | None = None,
    source_url: str = "",
    actor=None,
    ip_address: str | None = None,
) -> Advisory:
    """
    Creates an official advisory and logs an immutable AuditEntry.
    Calculates bbox from port_slug + radius_km if explicit coords are not given.
    """
    now = dj_timezone.now()
    issued_at = issued_at or now
    expires_at = expires_at or (now + timedelta(days=2))

    if port_slug and (min_lat is None or min_lon is None):
        port = Port.objects.filter(slug__iexact=port_slug).first()
        if port:
            d_lat = km_to_deg_lat(radius_km)
            d_lon = km_to_deg_lon(radius_km, port.lat)
            min_lat = port.lat - d_lat
            max_lat = port.lat + d_lat
            min_lon = port.lon - d_lon
            max_lon = port.lon + d_lon
        else:
            min_lat, max_lat, min_lon, max_lon = 0.0, 35.0, 60.0, 95.0
    else:
        min_lat = min_lat if min_lat is not None else 0.0
        max_lat = max_lat if max_lat is not None else 35.0
        min_lon = min_lon if min_lon is not None else 60.0
        max_lon = max_lon if max_lon is not None else 95.0

    source_obj, _ = DataSource.objects.get_or_create(
        slug="manual_advisories",
        defaults={"name": "Official Manual Advisories", "is_enabled": True},
    )

    content_hash = Advisory.compute_content_hash(headline, body, severity)
    adv, created = Advisory.objects.update_or_create(
        source=source_obj,
        external_id=f"man-{content_hash[:16]}",
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

    action = "manual_advisory_created" if created else "manual_advisory_updated"
    log_audit(
        actor=actor,
        action=action,
        object_type="Advisory",
        object_id=str(adv.public_id),
        details={"headline": headline, "severity": severity, "issuer": issuer},
        ip_address=ip_address,
    )
    return adv


def import_advisories_from_csv(csv_content: str, actor=None) -> int:
    """
    Imports advisories from CSV content.
    Expected columns: issuer, headline, body, severity, port_slug, radius_km, source_url
    """
    reader = csv.DictReader(StringIO(csv_content))
    count = 0
    for row in reader:
        create_manual_advisory(
            headline=row.get("headline", "Marine Weather Advisory"),
            body=row.get("body", ""),
            severity=row.get("severity", "info").lower(),
            issuer=row.get("issuer", "IMD"),
            port_slug=row.get("port_slug"),
            radius_km=float(row.get("radius_km", 50.0)),
            source_url=row.get("source_url", ""),
            actor=actor,
        )
        count += 1
    return count


class OfficialScraperInterface:
    """
    Scraper interface for IMD and INCOIS bulletins.
    DISABLED BY DEFAULT: Requires the website owner's explicit written permission
    under Government of India open access terms.
    """

    is_enabled: bool = False
    status_message: str = (
        "Automated scraping is disabled by default. "
        "Operational activation requires verified written confirmation of permission from IMD / INCOIS."
    )

    @classmethod
    def scrape_imd_bulletins(cls) -> list[dict[str, Any]]:
        if not cls.is_enabled:
            logger.info("imd_scraper_disabled_by_policy")
            return []
        raise NotImplementedError("Scraper requires verified written permission.")

    @classmethod
    def scrape_incois_bulletins(cls) -> list[dict[str, Any]]:
        if not cls.is_enabled:
            logger.info("incois_scraper_disabled_by_policy")
            return []
        raise NotImplementedError("Scraper requires verified written permission.")
