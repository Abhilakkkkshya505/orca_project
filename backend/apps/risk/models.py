from django.conf import settings
from django.db import models

from apps.core.models import PublicIdModel, TimeStampedModel


class RiskAssessment(TimeStampedModel, PublicIdModel):
    """
    Immutable audit trail row for every safety evaluation produced by ORCA.
    Guarantees full reproducibility and accountability for safety ratings.
    """

    class LevelChoice(models.TextChoices):
        SAFE = "safe", "Safe"
        CAUTION = "caution", "Caution"
        UNSAFE = "unsafe", "Unsafe"
        UNKNOWN = "unknown", "Unknown"

    class VesselChoice(models.TextChoices):
        SMALL_CRAFT = "small_craft", "Small Craft"
        MECHANISED = "mechanised", "Mechanised"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="risk_assessments",
    )
    lat = models.FloatField(db_index=True)
    lon = models.FloatField(db_index=True)
    vessel_class = models.CharField(max_length=20, choices=VesselChoice.choices, default=VesselChoice.SMALL_CRAFT)

    valid_from = models.DateTimeField(db_index=True)
    valid_to = models.DateTimeField(db_index=True)

    level = models.CharField(max_length=10, choices=LevelChoice.choices, db_index=True)
    factors = models.JSONField(default=list)
    advisory_ids = models.JSONField(default=list)
    data_ages = models.JSONField(default=dict)
    rules_version = models.CharField(max_length=20)

    # Nullable link to chat message
    thread_message_id = models.CharField(max_length=64, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="assessment_user_created_idx"),
            models.Index(fields=["lat", "lon"], name="assessment_coords_idx"),
        ]

    def __str__(self):
        return f"RiskAssessment({self.public_id}, level={self.level}, vessel={self.vessel_class})"


class FishingZone(TimeStampedModel, PublicIdModel):
    """Productive fishing zone estimation or official PFZ bulletin point."""

    class OriginChoice(models.TextChoices):
        OFFICIAL_PFZ = "official_pfz", "Official INCOIS PFZ Bulletin"
        ORCA_HEURISTIC = "orca_heuristic", "ORCA SST/Chlorophyll Front Estimation"

    assessment = models.ForeignKey(RiskAssessment, on_delete=models.CASCADE, related_name="fishing_zones")
    lat = models.FloatField()
    lon = models.FloatField()
    score = models.IntegerField(default=50)  # 0 to 100
    risk_level = models.CharField(max_length=10, choices=RiskAssessment.LevelChoice.choices)
    factors = models.JSONField(default=dict)
    origin = models.CharField(max_length=20, choices=OriginChoice.choices, default=OriginChoice.ORCA_HEURISTIC)

    def __str__(self):
        return f"FishingZone({self.lat:.2f}, {self.lon:.2f}, score={self.score}, origin={self.origin})"
