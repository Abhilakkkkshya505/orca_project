"""Chat views for ORCA conversation threads and SSE message streaming.

Part F: Conversation behaviour, multi-turn follow-ups, guest quotas, and robust SSE.
"""

import json
import uuid
from collections.abc import Generator
from typing import Any

from django.core.cache import cache
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.turnstile import verify_turnstile
from apps.agents.orchestrator import Orchestrator
from apps.chat.models import Message, Thread
from apps.chat.serializers import (
    ChatMessagePostSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadSerializer,
)


def _get_thread_for_request(request, thread_id: str) -> Thread:
    """Helper to retrieve a thread and strictly verify ownership."""
    try:
        uuid_obj = uuid.UUID(str(thread_id))
    except (ValueError, TypeError):
        raise NotFound(detail="Thread not found.")

    try:
        thread = Thread.objects.get(public_id=uuid_obj, is_deleted=False)
    except Thread.DoesNotExist:
        raise NotFound(detail="Thread not found.")

    if request.user.is_authenticated:
        if thread.user_id != request.user.id:
            raise NotFound(detail="Thread not found.")
    else:
        session_key = request.session.session_key
        if not session_key or thread.session_key != session_key:
            raise NotFound(detail="Thread not found.")

    return thread


class ThreadListCreateView(APIView):
    """
    POST /chat/threads/: Create thread (guest or authenticated).
    GET /chat/threads/: List threads (authenticated users only).
    """

    permission_classes = [AllowAny]
    serializer_class = ThreadCreateSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [AllowAny()]

    def post(self, request):
        serializer = ThreadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        title = serializer.validated_data.get("title") or "New Marine Inquiry"

        if request.user.is_authenticated:
            thread = Thread.objects.create(
                user=request.user,
                title=title,
                last_message_at=timezone.now(),
            )
        else:
            if not request.session.session_key:
                request.session.save()
            thread = Thread.objects.create(
                session_key=request.session.session_key,
                title=title,
                last_message_at=timezone.now(),
            )

        return Response(ThreadSerializer(thread).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        threads = Thread.objects.filter(user=request.user, is_deleted=False).order_by("-last_message_at")
        serializer = ThreadSerializer(threads, many=True)
        return Response({"results": serializer.data, "count": threads.count()})


class ThreadDetailView(APIView):
    """
    GET /chat/threads/{id}/: View thread with messages.
    DELETE /chat/threads/{id}/: Soft delete thread.
    """

    permission_classes = [AllowAny]
    serializer_class = ThreadDetailSerializer

    def get(self, request, thread_id):
        thread = _get_thread_for_request(request, thread_id)
        return Response(ThreadDetailSerializer(thread).data)

    def delete(self, request, thread_id):
        thread = _get_thread_for_request(request, thread_id)
        thread.is_deleted = True
        thread.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageStreamView(APIView):
    """
    POST /chat/threads/{id}/messages/
    Streams SSE events: status, risk, map, token, clarification, done, error.
    """

    permission_classes = [AllowAny]
    serializer_class = ChatMessagePostSerializer

    def post(self, request, thread_id):
        thread = _get_thread_for_request(request, thread_id)

        serializer = ChatMessagePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        content = data["content"]
        location = data.get("location")
        vessel_class = data.get("vessel_class", "small_craft")
        turnstile_token = data.get("turnstile_token")

        # Guest quota check (Part F4)
        guest_quota_info = None
        if not request.user.is_authenticated:
            session_key = request.session.session_key or request.META.get("REMOTE_ADDR", "unknown")
            cache_key = f"guest_chat_quota:{session_key}"
            current_count = int(cache.get(cache_key) or 0)

            if current_count >= 10:
                return Response(
                    {
                        "error": "quota_exceeded",
                        "message": "You have reached the guest limit of 10 inquiries per hour. Please sign in or try again in an hour.",
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Turnstile token required after 5 guest questions (remaining <= 5)
            if current_count >= 5:
                if not turnstile_token:
                    return Response(
                        {
                            "error": "turnstile_required",
                            "message": "Security verification required. Please complete the captcha check to continue.",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                verify_turnstile(turnstile_token, ip=request.META.get("REMOTE_ADDR"))

            # Increment count
            cache.set(cache_key, current_count + 1, timeout=3600)
            guest_quota_info = {
                "remaining": max(0, 10 - (current_count + 1)),
                "total": 10,
            }

        # Multi-turn context: retrieve last assistant message's intent (Part F1)
        prev_intent = None
        last_assistant_msg = (
            thread.messages.filter(role="assistant").order_by("-created_at").first()
        )
        if last_assistant_msg and last_assistant_msg.payload and isinstance(last_assistant_msg.payload, dict):
            prev_intent = last_assistant_msg.payload.get("intent")

        # Save user message immediately
        Message.objects.create(
            thread=thread,
            role="user",
            content=content,
        )

        def event_stream_generator() -> Generator[str, None, None]:
            # Flush connection immediately with a comment
            yield ": ping\n\n"

            orchestrator = Orchestrator()
            assistant_tokens: list[str] = []
            risk_payload = None
            resolved_intent = None

            try:
                for event in orchestrator.process_query(
                    user_query=content,
                    user=thread.user,
                    location=location,
                    vessel_class=vessel_class,
                    previous_intent=prev_intent,
                ):
                    evt_type = event.get("event", "message")
                    evt_data = event.get("data", {})

                    if evt_type == "risk":
                        risk_payload = evt_data
                    elif evt_type == "token":
                        assistant_tokens.append(evt_data.get("text", ""))
                    elif evt_type == "done":
                        resolved_intent = evt_data.get("intent")
                        if guest_quota_info:
                            evt_data["quota"] = guest_quota_info

                    yield f"event: {evt_type}\ndata: {json.dumps(evt_data)}\n\n"

                # Persist assistant reply
                assistant_text = "".join(assistant_tokens).strip()
                payload_to_store: dict[str, Any] = {}
                if risk_payload:
                    payload_to_store["risk"] = risk_payload
                if resolved_intent:
                    payload_to_store["intent"] = resolved_intent

                Message.objects.create(
                    thread=thread,
                    role="assistant",
                    content=assistant_text,
                    payload=payload_to_store if payload_to_store else None,
                )
                thread.last_message_at = timezone.now()
                thread.save(update_fields=["last_message_at"])

            except Exception as exc:
                logger.error("chat_stream_error", error=str(exc))
                err_payload = {
                    "code": "agent_execution_error",
                    "message": f"An evaluation error occurred: {str(exc)}",
                }
                yield f"event: error\ndata: {json.dumps(err_payload)}\n\n"

        response = StreamingHttpResponse(
            event_stream_generator(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Connection"] = "keep-alive"
        return response
