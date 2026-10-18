"""Tests for geodata ingestion idempotency and spatial advisory filtering."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.geodata.models import Advisory, DataSource, ForecastSnapshot, GridCell
from apps.geodata.sources.base import RawRecord
from apps.geodata.tasks import ingest_source_task


@pytest.fixture
def api_client():
    return APIClient()


def _mock_fetch(self, lat: float, lon: float, since=None):
    fixed_issued = datetime(2026, 10, 18, 10, 0, tzinfo=UTC)
    t1 = datetime(2026, 10, 18, 11, 0, tzinfo=UTC).isoformat()
    t2 = datetime(2026, 10, 18, 12, 0, tzinfo=UTC).isoformat()
    marine_data = {
        "hourly": {
            "time": [t1, t2],
            "wave_height": [1.4, 1.5],
            "wave_period": [7.0, 7.2],
        }
    }
    weather_data = {
        "hourly": {
            "time": [t1, t2],
            "wind_speed_10m": [18.0, 20.0],
            "wind_gusts_10m": [25.0, 28.0],
            "precipitation": [0.0, 0.5],
        }
    }
    return [
        RawRecord(
            source_slug=self.slug,
            lat=lat,
            lon=lon,
            issued_at=fixed_issued,
            data={"marine": marine_data, "weather": weather_data},
        )
    ]


@pytest.mark.django_db
def test_ingestion_idempotency():
    """Running ingestion tasks multiple times does not duplicate snapshots."""
    cell, _ = GridCell.objects.get_or_create(lat=9.97, lon=76.24, defaults={"resolution_deg": 0.1})
    source, _ = DataSource.objects.get_or_create(
        slug="open_meteo",
        defaults={"name": "Open Meteo", "is_enabled": True},
    )

    with patch("apps.geodata.sources.open_meteo.OpenMeteoAdapter.fetch", _mock_fetch):
        # Ingest first time
        res1 = ingest_source_task("open_meteo")
        initial_count = ForecastSnapshot.objects.filter(cell=cell, source=source).count()

        # Ingest second time
        res2 = ingest_source_task("open_meteo")
        final_count = ForecastSnapshot.objects.filter(cell=cell, source=source).count()

    assert res1.get("status") == "success"
    assert res2.get("status") == "success"
    assert initial_count > 0
    # Snapshots count should remain identical because update_or_create is idempotent
    assert final_count == initial_count


@pytest.mark.django_db
def test_advisories_spatial_near_filtering(api_client):
    """Near coordinate filter checks bounding box containment."""
    source, _ = DataSource.objects.get_or_create(slug="incois", defaults={"name": "INCOIS"})
    now = timezone.now()

    # Advisory 1 covers Kerala coast: lat 8.0 to 12.0, lon 75.0 to 77.0
    Advisory.objects.create(
        source=source,
        external_id="ADV-KERALA-01",
        headline="Kerala High Swell",
        body="High waves expected.",
        severity="watch",
        min_lat=8.0,
        max_lat=12.0,
        min_lon=75.0,
        max_lon=77.0,
        issued_at=now,
        expires_at=now + timedelta(hours=24),
        content_hash="hash1",
    )

    # Advisory 2 covers Gujarat coast: lat 20.0 to 24.0, lon 68.0 to 72.0
    Advisory.objects.create(
        source=source,
        external_id="ADV-GUJARAT-01",
        headline="Gujarat Cyclone Alert",
        body="Squally winds.",
        severity="warning",
        min_lat=20.0,
        max_lat=24.0,
        min_lon=68.0,
        max_lon=72.0,
        issued_at=now,
        expires_at=now + timedelta(hours=24),
        content_hash="hash2",
    )

    # Query near Kochi (9.97, 76.24) -> should match Kerala, not Gujarat
    resp = api_client.get("/api/v1/advisories/?near=9.97,76.24")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["count"] == 1
    assert data["results"][0]["headline"] == "Kerala High Swell"

    # Query near Porbandar (21.64, 69.60) -> should match Gujarat, not Kerala
    resp_guj = api_client.get("/api/v1/advisories/?near=21.64,69.60")
    assert resp_guj.status_code == status.HTTP_200_OK
    data_guj = resp_guj.json()
    assert data_guj["count"] == 1
    assert data_guj["results"][0]["headline"] == "Gujarat Cyclone Alert"
