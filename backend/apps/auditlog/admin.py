"""Admin configuration for AuditEntry (read-only)."""

from django.contrib import admin

from apps.auditlog.models import AuditEntry


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    list_display = ["created_at", "actor", "action", "object_type", "object_id", "ip_address"]
    list_filter = ["action", "object_type", "created_at"]
    search_fields = ["actor__email", "action", "object_type", "object_id"]
    readonly_fields = [
        "public_id",
        "actor",
        "action",
        "object_type",
        "object_id",
        "details",
        "ip_address",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
