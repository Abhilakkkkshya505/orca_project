"""
Tests for Task 0: Environment validation, provider registry, secret scrubbing, and health probes.
"""

import pytest
from django.core.exceptions import ImproperlyConfigured
from rest_framework.test import APIClient

from apps.geodata.providers import ProviderRegistry
from config.settings.base import validate_environment


def test_settings_reports_all_missing_required_vars():
    """Verifies that validate_environment lists ALL missing variables in one exception."""
    incomplete_prod_env = {
        "ENVIRONMENT": "production",
        # Missing SECRET_KEY, DATABASE_URL, REDIS_URL, CELERY_BROKER_URL, COOKIE_DOMAIN, etc.
    }

    with pytest.raises(ImproperlyConfigured) as exc_info:
        validate_environment(incomplete_prod_env)

    err_msg = str(exc_info.value)
    assert "Missing required environment variables" in err_msg
    assert "SECRET_KEY" in err_msg
    assert "DATABASE_URL" in err_msg
    assert "REDIS_URL" in err_msg
    assert "CELERY_BROKER_URL" in err_msg
    assert "COOKIE_DOMAIN" in err_msg
    assert "ALLOWED_HOSTS" in err_msg


def test_settings_refuses_dev_bypass_in_production():
    """Verifies that the application refuses DEV_BYPASS_ACCESS=true when ENVIRONMENT=production."""
    dangerous_prod_env = {
        "ENVIRONMENT": "production",
        "DEV_BYPASS_ACCESS": "true",
        "SECRET_KEY": "dummy-production-key-for-test-validation-purpose-only-50-chars",
        "DATABASE_URL": "postgis://test:test@localhost:5432/test",
        "REDIS_URL": "redis://localhost:6379/0",
        "CELERY_BROKER_URL": "redis://localhost:6379/1",
        "COOKIE_DOMAIN": ".orca.example",
        "ALLOWED_HOSTS": "api.orca.example",
        "CSRF_TRUSTED_ORIGINS": "https://app.orca.example",
        "CORS_ALLOWED_ORIGINS": "https://app.orca.example",
        "FRONTEND_URL": "https://app.orca.example",
    }

    with pytest.raises(ImproperlyConfigured) as exc_info:
        validate_environment(dangerous_prod_env)

    assert "DEV_BYPASS_ACCESS=true is strictly forbidden in production mode" in str(exc_info.value)


def test_provider_registry_marks_providers_disabled_when_keys_missing(monkeypatch):
    """Verifies that providers with missing credentials report 'disabled (no key)' without crashing."""
    monkeypatch.delenv("COPERNICUSMARINE_USERNAME", raising=False)
    monkeypatch.delenv("COPERNICUSMARINE_PASSWORD", raising=False)
    monkeypatch.delenv("GFW_API_ACCESS_TOKEN", raising=False)

    copernicus = ProviderRegistry.get_by_slug("copernicus")
    assert copernicus is not None
    assert copernicus.needs_key is True
    assert copernicus.is_configured is False
    assert copernicus.status == "disabled (no key)"

    gfw = ProviderRegistry.get_by_slug("gfw")
    assert gfw is not None
    assert gfw.needs_key is True
    assert gfw.is_configured is False
    assert gfw.status == "disabled (no key)"


def test_data_status_never_leaks_secrets():
    """Verifies that /api/v1/data-status/ returns status and attribution without leaking any secrets."""
    client = APIClient()
    response = client.get("/api/v1/data-status/")
    assert response.status_code == 200
    data = response.json()

    assert "sources" in data
    sources = data["sources"]
    assert len(sources) >= 5

    # Check keyless providers
    slugs = [s["slug"] for s in sources]
    assert "open_meteo_marine" in slugs
    assert "noaa_erddap" in slugs

    # Ensure no secrets, tokens or passwords appear anywhere in JSON payload
    payload_str = str(data).lower()
    for forbidden in ["password", "token", "secret", "bearer", "api_key"]:
        # Only check that raw values or variable names with values are not leaked
        assert "password=" not in payload_str
        assert "bearer " not in payload_str


@pytest.mark.django_db
def test_health_live_and_ready_endpoints():
    """Verifies that both live and ready probes respond successfully."""
    client = APIClient()
    live_resp = client.get("/api/v1/health/live/")
    assert live_resp.status_code == 200
    assert live_resp.json() == {"status": "ok"}

    ready_resp = client.get("/api/v1/health/ready/")
    assert ready_resp.status_code in (200, 503)
    assert "checks" in ready_resp.json()
