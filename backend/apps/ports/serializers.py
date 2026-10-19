from rest_framework import serializers
from apps.ports.models import Port
from apps.risk.models import RiskAssessment


class PortListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    current_level = serializers.SerializerMethodField()
    current_level_valid_to = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(required=False, read_only=True)

    class Meta:
        model = Port
        fields = [
            "id",
            "slug",
            "name",
            "country_code",
            "country_name",
            "admin1_name",
            "port_type",
            "lat",
            "lon",
            "is_coastal",
            "current_level",
            "current_level_valid_to",
            "distance_km",
        ]

    def get_current_level(self, obj) -> str | None:
        # Check if latest valid assessment exists for this port's coordinates
        latest = (
            RiskAssessment.objects.filter(lat=obj.lat, lon=obj.lon)
            .order_by("-valid_to")
            .first()
        )
        if latest and latest.is_currently_valid:
            return latest.level
        return None

    def get_current_level_valid_to(self, obj) -> str | None:
        latest = (
            RiskAssessment.objects.filter(lat=obj.lat, lon=obj.lon)
            .order_by("-valid_to")
            .first()
        )
        if latest and latest.is_currently_valid:
            return latest.valid_to.isoformat()
        return None


class NearbyPortSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    slug = serializers.CharField()
    name = serializers.CharField()
    country_code = serializers.CharField()
    admin1_name = serializers.CharField()
    lat = serializers.FloatField()
    lon = serializers.FloatField()
    distance_km = serializers.FloatField()
    bearing = serializers.FloatField()
    is_coastal = serializers.BooleanField()


class PortDetailSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    location = serializers.SerializerMethodField()
    marine_location = serializers.SerializerMethodField()
    offset_message = serializers.SerializerMethodField()
    nearby_ports = serializers.SerializerMethodField()
    current_level = serializers.SerializerMethodField()
    current_level_valid_to = serializers.SerializerMethodField()
    data_freshness = serializers.SerializerMethodField()

    class Meta:
        model = Port
        fields = [
            "id",
            "slug",
            "name",
            "name_ascii",
            "alt_names",
            "country_code",
            "country_name",
            "admin1_name",
            "admin1_code",
            "port_type",
            "harbour_size",
            "unlocode",
            "lat",
            "lon",
            "location",
            "marine_location",
            "marine_offset_km",
            "offset_message",
            "is_coastal",
            "is_active",
            "current_level",
            "current_level_valid_to",
            "nearby_ports",
            "data_freshness",
            "source",
            "created_at",
            "updated_at",
        ]

    def get_location(self, obj) -> dict:
        return {"lat": obj.lat, "lon": obj.lon}

    def get_marine_location(self, obj) -> dict | None:
        if obj.marine_lat is not None and obj.marine_lon is not None:
            return {"lat": obj.marine_lat, "lon": obj.marine_lon}
        return None

    def get_offset_message(self, obj) -> str | None:
        if obj.marine_offset_km is not None and obj.marine_offset_km > 5.0:
            return f"Sea conditions measured {obj.marine_offset_km:.1f} km from the port"
        return None

    def get_nearby_ports(self, obj) -> list[dict]:
        # Return 5 closest ports using distance calculation
        nearby = (
            Port.objects.exclude(id=obj.id)
            .filter(is_active=True)
            .only("public_id", "slug", "name", "country_code", "admin1_name", "lat", "lon", "is_coastal")
        )
        scored = []
        for p in nearby:
            d = obj.distance_to(p.lat, p.lon)
            if d <= 300.0:  # Within 300 km
                b = obj.bearing_to(p.lat, p.lon)
                scored.append({
                    "id": p.public_id,
                    "slug": p.slug,
                    "name": p.name,
                    "country_code": p.country_code,
                    "admin1_name": p.admin1_name,
                    "lat": p.lat,
                    "lon": p.lon,
                    "distance_km": round(d, 1),
                    "bearing": b,
                    "is_coastal": p.is_coastal,
                })
        scored.sort(key=lambda x: x["distance_km"])
        return scored[:5]

    def get_current_level(self, obj) -> str | None:
        latest = (
            RiskAssessment.objects.filter(lat=obj.lat, lon=obj.lon)
            .order_by("-valid_to")
            .first()
        )
        if latest and latest.is_currently_valid:
            return latest.level
        return None

    def get_current_level_valid_to(self, obj) -> str | None:
        latest = (
            RiskAssessment.objects.filter(lat=obj.lat, lon=obj.lon)
            .order_by("-valid_to")
            .first()
        )
        if latest and latest.is_currently_valid:
            return latest.valid_to.isoformat()
        return None

    def get_data_freshness(self, obj) -> dict:
        latest = (
            RiskAssessment.objects.filter(lat=obj.lat, lon=obj.lon)
            .order_by("-created_at")
            .first()
        )
        if latest:
            return {
                "last_evaluated_at": latest.created_at.isoformat(),
                "data_ages": latest.data_ages,
            }
        return {"last_evaluated_at": None, "data_ages": {}}
