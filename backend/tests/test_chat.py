"""Tests for chat conversation threads and SSE event streaming."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.chat.models import Thread

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user(db):
    user = User.objects.create(
        email="chatuser@example.com",
        display_name="Chat Captain",
        is_email_verified=True,
    )
    user.set_password("SecurePass123!")
    user.save()
    return user


@pytest.mark.django_db
def test_thread_lifecycle_authenticated(api_client, test_user):
    """Authenticated user creates thread, lists threads, views detail, and soft-deletes."""
    api_client.force_authenticate(user=test_user)

    # 1. Create thread
    resp = api_client.post("/api/v1/chat/threads/", {"title": "Kochi Departure Inquiry"})
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    thread_id = data["id"]
    assert data["title"] == "Kochi Departure Inquiry"

    # 2. List threads
    resp_list = api_client.get("/api/v1/chat/threads/")
    assert resp_list.status_code == status.HTTP_200_OK
    assert resp_list.json()["count"] == 1

    # 3. View detail
    resp_detail = api_client.get(f"/api/v1/chat/threads/{thread_id}/")
    assert resp_detail.status_code == status.HTTP_200_OK
    assert resp_detail.json()["id"] == thread_id

    # 4. Soft delete
    resp_del = api_client.delete(f"/api/v1/chat/threads/{thread_id}/")
    assert resp_del.status_code == status.HTTP_204_NO_CONTENT

    # Thread no longer appears in active list or detail
    assert api_client.get(f"/api/v1/chat/threads/{thread_id}/").status_code == status.HTTP_404_NOT_FOUND
    assert api_client.get("/api/v1/chat/threads/").json()["count"] == 0


@pytest.mark.django_db
def test_chat_sse_streaming_response(api_client, test_user):
    """POST to messages endpoint returns text/event-stream with ordered events."""
    api_client.force_authenticate(user=test_user)

    # Create thread
    resp = api_client.post("/api/v1/chat/threads/", {"title": "Weather Check"})
    thread_id = resp.json()["id"]

    # Post message to initiate stream
    stream_resp = api_client.post(
        f"/api/v1/chat/threads/{thread_id}/messages/",
        {
            "content": "Is it safe to go out from Kochi tomorrow morning?",
            "location": {"lat": 9.97, "lon": 76.24},
            "vessel_class": "small_craft",
        },
        format="json",
    )

    assert stream_resp.status_code == status.HTTP_200_OK
    assert stream_resp["Content-Type"] == "text/event-stream"

    # Consume stream chunks
    raw_content = b"".join(stream_resp.streaming_content).decode("utf-8")
    assert "event: status" in raw_content
    assert "event: risk" in raw_content
    assert "event: map" in raw_content
    assert "event: token" in raw_content
    assert "event: done" in raw_content

    # Verify messages saved to database (user query + assistant response)
    thread = Thread.objects.get(public_id=thread_id)
    messages = list(thread.messages.all())
    assert len(messages) == 2
    assert messages[0].role == "user"
    assert messages[0].content == "Is it safe to go out from Kochi tomorrow morning?"
    assert messages[1].role == "assistant"
    assert len(messages[1].content) > 0
    assert messages[1].payload is not None  # RiskAssessment payload attached
