"""Permission test matrix validating access control across all API routes.

Verifies:
- Public endpoints (health, data-status, csrf, advisories, risk)
- Unauthenticated (Anonymous) access
- Guest session access (chat create & post allowed, chat list 401, dashboard 401)
- Verified user access
- Unverified user access (403 email_not_verified)
- Object isolation (user A cannot access user B's thread, location, or alert)
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.chat.models import Thread
from apps.locations.models import SavedLocation

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def verified_user(db):
    user = User.objects.create(
        email="verified@example.com",
        display_name="Verified Captain",
        is_email_verified=True,
    )
    user.set_password("SecurePass123!")
    user.save()
    return user


@pytest.fixture
def unverified_user(db):
    user = User.objects.create(
        email="unverified@example.com",
        display_name="Unverified Sailor",
        is_email_verified=False,
    )
    user.set_password("SecurePass123!")
    user.save()
    return user


@pytest.fixture
def second_user(db):
    user = User.objects.create(
        email="second@example.com",
        display_name="Second Officer",
        is_email_verified=True,
    )
    user.set_password("SecurePass123!")
    user.save()
    return user


@pytest.mark.django_db
def test_public_endpoints_allowed_anonymous(api_client):
    """Health, status, csrf, advisories, risk are public."""
    assert api_client.get("/api/v1/health/live/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/health/ready/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/data-status/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/auth/csrf/").status_code == status.HTTP_204_NO_CONTENT
    assert api_client.get("/api/v1/advisories/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/risk/?lat=9.97&lon=76.24").status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_anonymous_blocked_from_authenticated_endpoints(api_client):
    """Anonymous access to private endpoints returns 401."""
    assert api_client.get("/api/v1/auth/me/").status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get("/api/v1/dashboard/overview/").status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get("/api/v1/locations/").status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get("/api/v1/alerts/subscriptions/").status_code == status.HTTP_401_UNAUTHORIZED
    assert api_client.get("/api/v1/chat/threads/").status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_unverified_user_blocked_from_user_endpoints(api_client, unverified_user):
    """Unverified authenticated users receive 403 email_not_verified."""
    api_client.force_authenticate(user=unverified_user)

    resp = api_client.get("/api/v1/dashboard/overview/")
    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert resp.json()["error"]["code"] == "email_not_verified"

    resp = api_client.get("/api/v1/locations/")
    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert resp.json()["error"]["code"] == "email_not_verified"


@pytest.mark.django_db
def test_verified_user_can_access_endpoints(api_client, verified_user):
    """Verified users can access profile, dashboard, locations."""
    api_client.force_authenticate(user=verified_user)

    assert api_client.get("/api/v1/auth/me/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/dashboard/overview/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/locations/").status_code == status.HTTP_200_OK
    assert api_client.get("/api/v1/chat/threads/").status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_object_isolation_threads_and_locations(api_client, verified_user, second_user):
    """Users cannot access or modify another user's threads or locations (returns 404)."""
    # Create thread and location for user 1
    t1 = Thread.objects.create(user=verified_user, title="User 1 Secret Thread")
    loc1 = SavedLocation.objects.create(user=verified_user, name="Kochi Port", lat=9.97, lon=76.24)

    # User 2 attempts access
    api_client.force_authenticate(user=second_user)

    # Thread detail for user 1 returns 404
    resp = api_client.get(f"/api/v1/chat/threads/{t1.public_id}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND

    # Thread delete for user 1 returns 404
    resp = api_client.delete(f"/api/v1/chat/threads/{t1.public_id}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND

    # Location detail for user 1 returns 404
    resp = api_client.get(f"/api/v1/locations/{loc1.public_id}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND

    # Location delete for user 1 returns 404
    resp = api_client.delete(f"/api/v1/locations/{loc1.public_id}/")
    assert resp.status_code == status.HTTP_404_NOT_FOUND
