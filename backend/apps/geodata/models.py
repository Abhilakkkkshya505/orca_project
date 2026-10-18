import hashlib

from django.db import models
from django.utils import timezone

from apps.core.models import PublicIdModel, TimeStampedModel


class DataSource(TimeStampedModel):
    """Configuration and health tracking for an external marine or weather data source."""

    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default="")
    last_error_at = models.DateTimeField(null=True, blank=True)
    expected_interval_minutes = models.PositiveIntegerField(default=180)  # e.g., 3 hours
    is_enabled = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.slug})"

    @property
    def age_minutes(self) -> int | None:
        if not self.last_success_at:
            return None
        diff = timezone.now() - self.last_success_at
        return int(diff.total_seconds() / 60)

    @property
    def status(self) -> str:
        if not self.is_enabled:
            return "disabled"
        age = self.age_minutes
        if age is None:
            return "failing"
        if age <= 1.5 * self.expected_interval_minutes:
            return "ok"
        if age <= 3.0 * self.expected_interval_minutes:
            return "stale"
        return "failing"


class GridCell(models.Model):
    """Spatial grid cell covering coastal ocean areas."""

    lat = models.FloatField(db_index=True)
    lon = models.FloatField(db_index=True)
    resolution_deg = models.FloatField(default=0.1)

    class Meta:
        unique_together = ("lat", "lon", "resolution_deg")
        indexes = [
            models.Index(fields=["lat", "lon"], name="gridcell_lat_lon_idx"),
        ]

    def __str__(self):
        return f"GridCell({self.lat:.2f}, {self.lon:.2f}, res={self.resolution_deg}°)"

    @classmethod
    def nearest(cls, lat: float, lon: float, max_dist_deg: float = 0.5):
        """Finds the nearest grid cell within max distance, or creates one if empty."""
        cells = cls.objects.filter(
            lat__gte=lat - max_dist_deg,
            lat__lte=lat + max_dist_deg,
            lon__gte=lon - max_dist_deg,
            lon__lte=lon + max_dist_deg,
        )
        best_cell = None
        min_dist_sq = float("inf")
        for cell in cells:
            dist_sq = (cell.lat - lat) ** 2 + (cell.lon - lon) ** 2
            if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                best_cell = cell

        if best_cell is None:
            # Snap to 0.1 degree grid
            snap_lat = round(lat, 1)
            snap_lon = round(lon, 1)
            best_cell, _ = cls.objects.get_or_create(lat=snap_lat, lon=snap_lon, defaults={"resolution_deg": 0.1})

        return best_cell


class ForecastSnapshot(models.Model):
    """Hourly point-forecast snapshot stored for a grid cell."""

    cell = models.ForeignKey(GridCell, on_delete=models.CASCADE, related_name="snapshots")
    source = models.ForeignKey(DataSource, on_delete=models.PROTECT, related_name="snapshots")
    valid_time = models.DateTimeField(db_index=True)
    issued_at = models.DateTimeField()
    ingested_at = models.DateTimeField(auto_now_add=True, db_index=True)
    values = models.JSONField(default=dict)

    class Meta:
        unique_together = ("cell", "source", "valid_time", "issued_at")
        indexes = [
            models.Index(fields=["cell", "valid_time"], name="snapshot_cell_valid_idx"),
            models.Index(fields=["ingested_at"], name="snapshot_ingested_idx"),
        ]

    def __str__(self):
        return f"Snapshot(cell={self.cell_id}, valid={self.valid_time}, source={self.source.slug})"


class Advisory(TimeStampedModel, PublicIdModel):
    """Official marine weather, high wave, cyclone, or potential fishing zone advisory."""

    class SeverityChoice(models.TextChoices):
        INFO = "info", "Informational"
        WATCH = "watch", "Watch"
        WARNING = "warning", "Warning"
        SEVERE = "severe", "Severe Warning"

    source = models.ForeignKey(DataSource, on_delete=models.PROTECT, related_name="advisories")
    external_id = models.CharField(max_length=100)
    headline = models.CharField(max_length=255)
    body = models.TextField()
    severity = models.CharField(
        max_length=20, choices=SeverityChoice.choices, default=SeverityChoice.INFO, db_index=True
    )

    # Bounding box coordinates for spatial filtering
    min_lat = models.FloatField(default=0.0)
    max_lat = models.FloatField(default=0.0)
    min_lon = models.FloatField(default=0.0)
    max_lon = models.FloatField(default=0.0)

    issued_at = models.DateTimeField(db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    source_url = models.URLField(max_length=500, blank=True, default="")
    content_hash = models.CharField(max_length=64)

    class Meta:
        unique_together = ("source", "external_id", "content_hash")
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["expires_at", "severity"], name="advisory_exp_sev_idx"),
            models.Index(fields=["min_lat", "max_lat", "min_lon", "max_lon"], name="advisory_bbox_idx"),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.headline} ({self.source.slug})"

    @property
    def is_active(self) -> bool:
        return self.expires_at > timezone.now()

    def contains_point(self, lat: float, lon: float) -> bool:
        return self.min_lat <= lat <= self.max_lat and self.min_lon <= lon <= self.max_lon

    @classmethod
    def compute_content_hash(cls, headline: str, body: str, severity: str) -> str:
        text = f"{headline.strip()}|{body.strip()}|{severity.strip()}".encode()
        return hashlib.sha256(text).hexdigest()
