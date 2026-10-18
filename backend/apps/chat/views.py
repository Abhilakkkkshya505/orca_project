"""Chat views for ORCA conversation threads and SSE message streaming."""

import json
import uuid
from collections.abc import Generator

from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound
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
    Streams SSE events: status, risk, map, token, done, error.
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

        # For guest sessions, verify turnstile token if present or enforced
        if not request.user.is_authenticated and turnstile_token:
            verify_turnstile(turnstile_token, ip=request.META.get("REMOTE_ADDR"))

        # Save user message immediately
        Message.objects.create(
            thread=thread,
            role="user",
            content=content,
        )

        def event_stream_generator() -> Generator[str, None, None]:
            orchestrator = Orchestrator()
            assistant_tokens = []
            risk_payload = None

            try:
                for event in orchestrator.process_query(
                    user_query=content,
                    user=thread.user,
                    location=location,
                    vessel_class=vessel_class,
                ):
                    evt_type = event.get("event", "message")
                    evt_data = event.get("data", {})

                    if evt_type == "risk":
                        risk_payload = evt_data
                    elif evt_type == "token":
                        assistant_tokens.append(evt_data.get("text", ""))

                    yield f"event: {evt_type}\ndata: {json.dumps(evt_data)}\n\n"

                # Persist assistant reply
                assistant_text = "".join(assistant_tokens).strip()
                Message.objects.create(
                    thread=thread,
                    role="assistant",
                    content=assistant_text,
                    payload=risk_payload,
                )
                thread.last_message_at = timezone.now()
                thread.save(update_fields=["last_message_at"])

            except Exception as exc:
                err_payload = {
                    "code": "agent_execution_error",
                    "message": str(exc),
                }
                yield f"event: error\ndata: {json.dumps(err_payload)}\n\n"

        response = StreamingHttpResponse(
            event_stream_generator(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
