"""
Base classes and interfaces for ORCA geodata provider adapters.
Implements:
- Standard fetch -> normalise -> validate -> store pipeline
- Exponential backoff with random jitter
- Per-provider rate limiting
- Structured logging and DataSource status tracking
- Dry-run mode
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timezone
import random
import time
from typing import Any
import structlog
from django.utils import timezone as dj_timezone

from apps.geodata.contracts import NormalizedTelemetry, QualityFlag, sanitize_value

logger = structlog.get_logger(__name__)


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


class BaseAdapter:
    """Base class for all ORCA geodata ingestion adapters."""

    slug: str = "base"
    name: str = "Base Adapter"
    timeout_seconds: float = 8.0
    min_request_interval_seconds: float = 0.5  # Rate limiting
    max_retries: int = 3
    base_backoff_seconds: float = 1.0

    def __init__(self):
        self._last_request_time: float = 0.0

    def is_available(self) -> bool:
        """Returns True if required credentials or network endpoints are configured."""
        return True

    def _rate_limit(self) -> None:
        """Enforces polite per-provider request spacing."""
        now = time.monotonic()
        elapsed = now - self._last_request_time
        if elapsed < self.min_request_interval_seconds:
            time.sleep(self.min_request_interval_seconds - elapsed)
        self._last_request_time = time.monotonic()

    def _execute_with_retry(self, func, *args, **kwargs) -> Any:
        """Executes a callable with exponential backoff and random jitter."""
        retries = 0
        while True:
            self._rate_limit()
            try:
                return func(*args, **kwargs)
            except Exception as e:
                retries += 1
                if retries > self.max_retries:
                    logger.error(
                        "adapter_max_retries_exceeded",
                        adapter=self.slug,
                        error=str(e),
                        attempts=retries,
                    )
                    raise
                jitter = random.uniform(0.1, 0.5)
                delay = (self.base_backoff_seconds * (2 ** (retries - 1))) + jitter
                logger.warning(
                    "adapter_request_retry",
                    adapter=self.slug,
                    error=str(e),
                    attempt=retries,
                    delay_seconds=round(delay, 2),
                )
                time.sleep(delay)

    def record_success(self) -> None:
        """Updates DataSource metadata on successful ingestion."""
        try:
            from apps.geodata.models import DataSource

            DataSource.objects.filter(slug=self.slug).update(
                last_success_at=dj_timezone.now(),
                last_error="",
            )
        except Exception as e:
            logger.debug("record_success_db_skipped", error=str(e))

    def record_error(self, error_msg: str) -> None:
        """Updates DataSource metadata on failed ingestion."""
        try:
            from apps.geodata.models import DataSource

            DataSource.objects.filter(slug=self.slug).update(
                last_error=error_msg[:1000],
                last_error_at=dj_timezone.now(),
            )
        except Exception as e:
            logger.debug("record_error_db_skipped", error=str(e))

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        """Fetches raw telemetry from provider."""
        raise NotImplementedError

    def normalise(self, raw: RawRecord) -> list[NormalizedTelemetry]:
        """Normalises raw data into canonical NormalizedTelemetry models."""
        raise NotImplementedError

    def store(
        self,
        telemetry_records: list[NormalizedTelemetry],
        cell: Any,
        dry_run: bool = False,
    ) -> int:
        """
        Stores NormalizedTelemetry records into ForecastSnapshot table idempotently.
        Returns number of snapshots saved/updated.
        """
        if dry_run or not telemetry_records:
            return len(telemetry_records)

        from apps.geodata.models import DataSource, ForecastSnapshot

        source_obj, _ = DataSource.objects.get_or_create(
            slug=self.slug,
            defaults={"name": self.name, "is_enabled": True},
        )

        saved = 0
        for rec in telemetry_records:
            if hasattr(rec, "to_snapshot_dict"):
                snap_values = rec.to_snapshot_dict()
            elif hasattr(rec, "values"):
                snap_values = rec.values
            elif isinstance(rec, dict):
                snap_values = rec
            else:
                snap_values = {}

            ForecastSnapshot.objects.update_or_create(
                cell=cell,
                source=source_obj,
                valid_time=rec.valid_time,
                issued_at=rec.issued_at,
                defaults={"values": snap_values},
            )
            saved += 1

        self.record_success()
        return saved


SourceAdapter = BaseAdapter
