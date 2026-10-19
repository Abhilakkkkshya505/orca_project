from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from apps.auditlog.models import AuditEntry
from apps.ports.models import Port
from apps.ports.normalisation import validate_coordinates, normalize_name, to_ascii, generate_unique_slug
from apps.ports.admin1 import resolve_admin1


class FishingHarbourAdminForm(forms.ModelForm):
    class Meta:
        model = Port
        fields = ["name", "lat", "lon", "country_code", "admin1_name", "port_type", "is_coastal", "is_active"]

    def clean(self):
        cleaned_data = super().clean()
        lat = cleaned_data.get("lat")
        lon = cleaned_data.get("lon")
        if lat is not None and lon is not None:
            is_valid, reason = validate_coordinates(lat, lon)
            if not is_valid:
                raise ValidationError(f"Invalid coordinates: {reason}")
        return cleaned_data


@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    form = FishingHarbourAdminForm
    list_display = [
        "name",
        "slug",
        "country_code",
        "admin1_name",
        "port_type",
        "lat",
        "lon",
        "is_coastal",
        "is_active",
        "marine_offset_km",
    ]
    list_filter = ["country_code", "admin1_name", "port_type", "is_coastal", "is_active", "source"]
    search_fields = ["name", "name_ascii", "slug", "alt_names", "unlocode"]
    readonly_fields = ["public_id", "slug", "marine_lat", "marine_lon", "marine_offset_km", "created_at", "updated_at"]
    ordering = ["name"]

    fieldsets = (
        ("Core Information", {
            "fields": ("public_id", "name", "name_ascii", "alt_names", "slug", "port_type", "unlocode")
        }),
        ("Location & Geography", {
            "fields": ("country_code", "country_name", "admin1_name", "admin1_code", "lat", "lon")
        }),
        ("Marine Grid Snapping", {
            "fields": ("marine_lat", "marine_lon", "marine_offset_km", "is_coastal")
        }),
        ("Status & Source", {
            "fields": ("is_active", "source", "source_ref", "created_at", "updated_at")
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.name_ascii:
            obj.name_ascii = to_ascii(obj.name)
        if not obj.slug:
            existing_slugs = set(Port.objects.exclude(id=obj.id).values_list("slug", flat=True))
            obj.slug = generate_unique_slug(obj.name, obj.country_code, obj.admin1_name, existing_slugs)
        if not obj.admin1_name:
            obj.admin1_name, obj.admin1_code = resolve_admin1(obj.lat, obj.lon, obj.country_code)

        super().save_model(request, obj, form, change)

        # Record audit log entry
        AuditEntry.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=AuditEntry.ActionChoice.USER_REGISTERED,
            object_type="Port",
            object_id=str(obj.public_id),
            metadata={
                "name": obj.name,
                "slug": obj.slug,
                "lat": obj.lat,
                "lon": obj.lon,
                "type": obj.port_type,
                "action": "updated" if change else "created",
            },
        )
