"""Admin configuration for DataSource, GridCell, ForecastSnapshot, and Advisory."""

from django.contrib import admin

from apps.auditlog.models import log_audit
from apps.geodata.models import Advisory, DataSource, ForecastSnapshot, GridCell


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "is_enabled",
        "status_badge",
        "last_success_at",
        "last_error_short",
        "expected_interval_minutes",
    ]
    list_editable = ["is_enabled"]
    list_filter = ["is_enabled"]
    search_fields = ["slug", "name"]
    readonly_fields = ["last_success_at", "last_error", "last_error_at", "created_at", "updated_at"]

    def status_badge(self, obj):
        return obj.status

    status_badge.short_description = "Status"

    def last_error_short(self, obj):
        if not obj.last_error:
            return "-"
        return obj.last_error[:60] + ("..." if len(obj.last_error) > 60 else "")

    last_error_short.short_description = "Last Error"

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        log_audit(
            actor=request.user,
            action="datasource_toggle" if "is_enabled" in form.changed_data else "datasource_updated",
            object_type="DataSource",
            object_id=str(obj.slug),
            details={"name": obj.name, "is_enabled": obj.is_enabled, "changed": form.changed_data},
            ip_address=request.META.get("REMOTE_ADDR"),
        )


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
