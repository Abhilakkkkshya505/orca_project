"""
Celery background tasks for oceanographic and meteorological telemetry ingestion.
Staggers tasks according to provider cadence and enforces idempotency.
"""

from datetime import timedelta
import structlog
from celery import shared_task
from django.utils import timezone

from apps.geodata.models import DataSource, ForecastSnapshot, GridCell
from apps.geodata.sources.gdacs_events import GdacsEventsAdapter
from apps.geodata.sources.noaa_erddap_chlorophyll import NoaaErddapChlorophyllAdapter
from apps.geodata.sources.noaa_erddap_sst import NoaaErddapSstAdapter
from apps.geodata.sources.open_meteo_forecast import OpenMeteoForecastAdapter
from apps.geodata.sources.open_meteo_marine import OpenMeteoMarineAdapter

logger = structlog.get_logger(__name__)

# Primary representative coastal monitoring points across India and Indian Ocean
KEY_COASTAL_POINTS = [
    (18.93, 72.84),  # Mumbai, Maharashtra
    (9.97, 76.24),   # Kochi, Kerala
    (13.08, 80.28),  # Chennai, Tamil Nadu
    (17.68, 83.22),  # Visakhapatnam, Andhra Pradesh
    (15.49, 73.82),  # Panaji, Goa
    (8.08, 77.55),   # Kanyakumari, Tamil Nadu
    (20.95, 70.36),  # Veraval, Gujarat
    (20.26, 86.68),  # Paradip, Odisha
    (11.67, 92.73),  # Port Blair, Andaman & Nicobar
    (21.68, 88.08),  # Sagar Island, West Bengal
]


@shared_task(acks_late=True, soft_time_limit=600)
def ingest_open_meteo_marine_task(points: list[tuple[float, float]] | None = None) -> int:
    """Ingests Open-Meteo marine wave and swell telemetry."""
    pts = points or KEY_COASTAL_POINTS
    adapter = OpenMeteoMarineAdapter()
    total_saved = 0

    for lat, lon in pts:
        try:
            cell = GridCell.nearest(lat, lon)
            raw_records = adapter.fetch(lat, lon)
            for raw in raw_records:
                norm_records = adapter.normalise(raw)
                total_saved += adapter.store(norm_records, cell)
        except Exception as e:
            logger.error("marine_ingest_point_error", lat=lat, lon=lon, error=str(e))

    logger.info("ingest_open_meteo_marine_finished", total_saved=total_saved)
    return total_saved


@shared_task(acks_late=True, soft_time_limit=600)
def ingest_open_meteo_forecast_task(points: list[tuple[float, float]] | None = None) -> int:
    """Ingests Open-Meteo atmospheric wind, gusts, and weather forecast."""
    pts = points or KEY_COASTAL_POINTS
    adapter = OpenMeteoForecastAdapter()
    total_saved = 0

    for lat, lon in pts:
        try:
            cell = GridCell.nearest(lat, lon)
            raw_records = adapter.fetch(lat, lon)
            for raw in raw_records:
                norm_records = adapter.normalise(raw)
                total_saved += adapter.store(norm_records, cell)
        except Exception as e:
            logger.error("forecast_ingest_point_error", lat=lat, lon=lon, error=str(e))

    logger.info("ingest_open_meteo_forecast_finished", total_saved=total_saved)
    return total_saved


@shared_task(acks_late=True)
def ingest_open_meteo_task() -> int:
    """Ingests Open-Meteo telemetry across representative coastal points."""
    from apps.geodata.sources.open_meteo import OpenMeteoAdapter
    adapter = OpenMeteoAdapter()
    total_saved = 0
    for lat, lon in KEY_COASTAL_POINTS:
        try:
            cell = GridCell.nearest(lat, lon)
            raw_records = adapter.fetch(lat, lon)
            for raw in raw_records:
                norm_records = adapter.normalise(raw)
                total_saved += adapter.store(norm_records, cell)
        except Exception as e:
            logger.error("open_meteo_ingest_error", lat=lat, lon=lon, error=str(e))

    m_count = ingest_open_meteo_marine_task()
    f_count = ingest_open_meteo_forecast_task()
    return total_saved + m_count + f_count


@shared_task(acks_late=True)
def ingest_noaa_erddap_task(points: list[tuple[float, float]] | None = None) -> int:
    """Ingests NOAA ERDDAP SST and Chlorophyll satellite products."""
    pts = points or KEY_COASTAL_POINTS[:4]
    sst_adapter = NoaaErddapSstAdapter()
    chla_adapter = NoaaErddapChlorophyllAdapter()
    total = 0

    for lat, lon in pts:
        cell = GridCell.nearest(lat, lon)
        try:
            raw_sst = sst_adapter.fetch(lat, lon)
            for raw in raw_sst:
                norm = sst_adapter.normalise(raw)
                total += sst_adapter.store(norm, cell)
        except Exception as e:
            logger.warning("noaa_sst_ingest_error", lat=lat, lon=lon, error=str(e))

        try:
            raw_chla = chla_adapter.fetch(lat, lon)
            for raw in raw_chla:
                norm = chla_adapter.normalise(raw)
                total += chla_adapter.store(norm, cell)
        except Exception as e:
            logger.warning("noaa_chla_ingest_error", lat=lat, lon=lon, error=str(e))

    logger.info("ingest_noaa_erddap_finished", total_saved=total)
    return total


@shared_task(acks_late=True)
def ingest_gdacs_events_task() -> int:
    """Pulls current global hazard alerts from GDACS feed."""
    adapter = GdacsEventsAdapter()
    raw_records = adapter.fetch()
    total = 0
    for raw in raw_records:
        total += adapter.ingest_events(raw.data)
    logger.info("ingest_gdacs_events_finished", advisories_ingested=total)
    return total


@shared_task(acks_late=True)
def ingest_copernicus_task():
    logger.info("ingest_copernicus_task_called")
    return 0


@shared_task(acks_late=True)
def ingest_advisories_task() -> int:
    """Ingests external global advisories (GDACS)."""
    return ingest_gdacs_events_task()


@shared_task(acks_late=True)
def prune_snapshots_task() -> int:
    """
    Prunes ForecastSnapshots older than 14 days past valid_time.
    Idempotent: running multiple times safely prunes matching rows.
    """
    cutoff = timezone.now() - timedelta(days=14)
    deleted_count, _ = ForecastSnapshot.objects.filter(valid_time__lt=cutoff).delete()
    logger.info("prune_snapshots_completed", deleted_count=deleted_count, cutoff=cutoff.isoformat())
    return deleted_count


@shared_task(acks_late=True)
def check_data_freshness_task() -> dict[str, str]:
    """
    Evaluates data freshness across all sources.
    Marks stale (age > 1.5x expected_interval) or failing (age > 3x, or 2 consecutive errors).
    """
    statuses = {}
    for ds in DataSource.objects.filter(is_enabled=True):
        st = ds.status
        statuses[ds.slug] = st
        if st in ("stale", "failing"):
            logger.warning(
                "data_source_degraded",
                source=ds.slug,
                status=st,
                age_minutes=ds.age_minutes,
                expected_interval_minutes=ds.expected_interval_minutes,
            )
        else:
            logger.info("data_source_healthy", source=ds.slug, status=st, age_minutes=ds.age_minutes)
    return statuses


@shared_task(acks_late=True)
def ingest_source_task(source_slug: str):
    """Dispatches ingestion for a specific data source slug."""
    if source_slug in ("open_meteo", "open_meteo_marine", "open_meteo_forecast"):
        count = ingest_open_meteo_task()
        return {"status": "success", "count": count}
    elif source_slug in ("noaa_erddap", "noaa_erddap_sst", "noaa_erddap_chlorophyll"):
        count = ingest_noaa_erddap_task()
        return {"status": "success", "count": count}
    elif source_slug in ("gdacs", "gdacs_events", "advisories"):
        count = ingest_gdacs_events_task()
        return {"status": "success", "count": count}
    elif source_slug == "copernicus":
        count = ingest_copernicus_task()
        return {"status": "success", "count": count}
    return {"status": "unsupported_source", "count": 0}
