"""Chat models for ORCA."""

from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q
from django.utils import timezone

from apps.core.models import PublicIdModel, TimeStampedModel


class Thread(TimeStampedModel, PublicIdModel):
    """Conversation thread between user/guest and ORCA multi-agent system."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_threads",
    )
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)
    title = models.CharField(max_length=120, blank=True, default="New Conversation")
    last_message_at = models.DateTimeField(default=timezone.now)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-last_message_at"]
        indexes = [
            models.Index(fields=["user", "-last_message_at"]),
            models.Index(fields=["session_key"]),
        ]
        constraints = [
            CheckConstraint(
                condition=Q(user__isnull=False) | Q(session_key__isnull=False),
                name="thread_user_or_session",
            )
        ]

    def __str__(self) -> str:
        return f"Thread {self.public_id} ({self.title})"


class Message(TimeStampedModel, PublicIdModel):
    """Single message within a thread, containing text and optional structured data payload."""

    ROLE_CHOICES = (
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    )

    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    payload = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"[{self.role}] {self.public_id} in {self.thread.public_id}"
