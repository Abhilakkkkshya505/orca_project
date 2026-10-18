"""Audit logging model and helper for immutable compliance tracking."""

from django.conf import settings
from django.db import models

from apps.core.models import PublicIdModel, TimeStampedModel


class AuditEntry(TimeStampedModel, PublicIdModel):
    """Append-only audit log entry for sensitive user and admin actions."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_entries",
    )
    action = models.CharField(max_length=80)
    object_type = models.CharField(max_length=80)
    object_id = models.CharField(max_length=80)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Audit entries"
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["object_type", "object_id"]),
        ]

    def __str__(self) -> str:
        actor_str = self.actor.email if self.actor else "system"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {actor_str} {self.action} on {self.object_type}:{self.object_id}"


def log_audit(
    action: str,
    object_type: str,
    object_id: str,
    actor=None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> AuditEntry:
    """Helper to record an immutable audit entry."""
    return AuditEntry.objects.create(
        actor=actor,
        action=action,
        object_type=object_type,
        object_id=str(object_id),
        details=details or {},
        ip_address=ip_address,
    )
