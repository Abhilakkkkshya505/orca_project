from datetime import timedelta

import structlog
from celery import shared_task
from django.utils import timezone

from apps.geodata.models import DataSource, ForecastSnapshot
from apps.geodata.services import ingest_for_cell
from apps.geodata.sources.open_meteo import OpenMeteoAdapter

logger = structlog.get_logger(__name__)

# Sample coastal key points along India coast
KEY_COASTAL_POINTS = [
    (9.97, 76.24),  # Kochi, Kerala
    (18.92, 72.83),  # Mumbai, Maharashtra
    (13.08, 80.27),  # Chennai, Tamil Nadu
    (17.68, 83.21),  # Visakhapatnam, Andhra Pradesh
    (15.49, 73.82),  # Panaji, Goa
    (8.08, 77.55),  # Kanyakumari, Tamil Nadu
    (20.95, 70.36),  # Veraval, Gujarat
]


@shared_task(acks_late=True, soft_time_limit=600)
def ingest_open_meteo_task():
    adapter = OpenMeteoAdapter()
    total_snapshots = 0
    for lat, lon in KEY_COASTAL_POINTS:
        try:
            count = ingest_for_cell(adapter, lat, lon)
            total_snapshots += count
        except Exception as e:
            logger.error("ingest_point_failed", lat=lat, lon=lon, error=str(e))

    logger.info("ingest_open_meteo_finished", total_snapshots=total_snapshots)
    return total_snapshots


@shared_task(acks_late=True)
def ingest_copernicus_task():
    logger.info("ingest_copernicus_stub_called")
    return 0


@shared_task(acks_late=True)
def ingest_advisories_task():
    logger.info("ingest_advisories_called")
    return 0


@shared_task(acks_late=True)
def prune_snapshots_task():
    """Prunes ForecastSnapshots older than 14 days according to docs/database.md."""
    cutoff = timezone.now() - timedelta(days=14)
    deleted_count, _ = ForecastSnapshot.objects.filter(valid_time__lt=cutoff).delete()
    logger.info("prune_snapshots_completed", deleted_count=deleted_count)
    return deleted_count


@shared_task(acks_late=True)
def check_data_freshness_task():
    """Evaluates data freshness across all sources."""
    for ds in DataSource.objects.filter(is_enabled=True):
        if ds.status in ("stale", "failing"):
            logger.warning("data_source_degraded", source=ds.slug, status=ds.status, age_minutes=ds.age_minutes)
    return True


@shared_task(acks_late=True)
def ingest_source_task(source_slug: str):
    """Dispatches ingestion for a specific data source slug."""
    if source_slug == "open_meteo":
        count = ingest_open_meteo_task()
        return {"status": "success", "count": count}
    elif source_slug == "copernicus":
        count = ingest_copernicus_task()
        return {"status": "success", "count": count}
    elif source_slug == "incois":
        count = ingest_advisories_task()
        return {"status": "success", "count": count}
    return {"status": "unsupported_source", "count": 0}
