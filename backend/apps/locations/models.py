"""Location and Alert Subscription models for ORCA."""

from django.conf import settings
from django.db import models

from apps.core.models import PublicIdModel, TimeStampedModel


class SavedLocation(TimeStampedModel, PublicIdModel):
    """User-saved coastal location with custom tag/kind."""

    KIND_CHOICES = (
        ("harbour", "Harbour / Port"),
        ("fishing_ground", "Fishing Ground"),
        ("coastal_point", "Coastal Point"),
        ("custom", "Custom"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_locations",
    )
    name = models.CharField(max_length=60)
    lat = models.FloatField()
    lon = models.FloatField()
    kind = models.CharField(max_length=30, choices=KIND_CHOICES, default="custom")

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_user_location_name"),
        ]
        indexes = [
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.lat:.2f}, {self.lon:.2f}) for {self.user.email}"


class AlertSubscription(TimeStampedModel, PublicIdModel):
    """Notification threshold subscription for a saved location."""

    LEVEL_CHOICES = (
        ("caution", "Caution or Unsafe"),
        ("unsafe", "Unsafe Only"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alert_subscriptions",
    )
    location = models.ForeignKey(
        SavedLocation,
        on_delete=models.CASCADE,
        related_name="alert_subscriptions",
    )
    min_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="caution")
    is_active = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    last_notified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "location"], name="unique_user_location_alert"),
        ]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return f"Alert ({self.min_level}) on {self.location.name} for {self.user.email}"
