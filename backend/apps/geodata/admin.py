"""Admin configuration for DataSource, GridCell, ForecastSnapshot, and Advisory."""

from django.contrib import admin

from apps.auditlog.models import log_audit
from apps.geodata.models import Advisory, DataSource, ForecastSnapshot, GridCell


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "is_enabled", "expected_interval_minutes", "updated_at"]
    list_filter = ["is_enabled"]
    search_fields = ["slug", "name"]


@admin.register(GridCell)
class GridCellAdmin(admin.ModelAdmin):
    list_display = ["id", "lat", "lon", "resolution_deg"]
    search_fields = ["lat", "lon"]


@admin.register(ForecastSnapshot)
class ForecastSnapshotAdmin(admin.ModelAdmin):
    list_display = ["id", "source", "cell", "valid_time", "ingested_at"]
    list_filter = ["source", "ingested_at"]
    readonly_fields = ["source", "cell", "issued_at", "valid_time", "values", "ingested_at"]


@admin.register(Advisory)
class AdvisoryAdmin(admin.ModelAdmin):
    list_display = ["headline", "severity", "source", "issued_at", "expires_at"]
    list_filter = ["severity", "source", "issued_at"]
    search_fields = ["headline", "body"]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        action_name = "advisory_updated" if change else "advisory_created_manual"
        log_audit(
            actor=request.user,
            action=action_name,
            object_type="Advisory",
            object_id=str(obj.public_id),
            details={"headline": obj.headline, "severity": obj.severity},
            ip_address=request.META.get("REMOTE_ADDR"),
        )
