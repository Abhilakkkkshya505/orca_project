"""Admin configuration for RiskAssessment and FishingZone (read-only)."""

from django.contrib import admin

from apps.risk.models import FishingZone, RiskAssessment


@admin.register(RiskAssessment)
class RiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ["public_id", "level", "lat", "lon", "vessel_class", "rules_version", "created_at"]
    list_filter = ["level", "vessel_class", "rules_version", "created_at"]
    search_fields = ["public_id", "user__email"]
    readonly_fields = [
        "public_id",
        "user",
        "level",
        "lat",
        "lon",
        "valid_from",
        "valid_to",
        "vessel_class",
        "factors",
        "advisory_ids",
        "data_ages",
        "rules_version",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FishingZone)
class FishingZoneAdmin(admin.ModelAdmin):
    list_display = ["public_id", "assessment", "score", "risk_level", "origin", "created_at"]
    list_filter = ["risk_level", "origin", "created_at"]
    readonly_fields = [
        "public_id",
        "assessment",
        "lat",
        "lon",
        "score",
        "risk_level",
        "origin",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
