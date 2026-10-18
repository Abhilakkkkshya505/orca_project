from rest_framework import serializers

from apps.geodata.models import Advisory


class AdvisoryListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    source = serializers.CharField(source="source.slug", read_only=True)
    body_excerpt = serializers.SerializerMethodField()
    area_centroid = serializers.SerializerMethodField()

    class Meta:
        model = Advisory
        fields = [
            "id",
            "headline",
            "body_excerpt",
            "severity",
            "source",
            "issued_at",
            "expires_at",
            "source_url",
            "area_centroid",
        ]

    def get_body_excerpt(self, obj) -> str:
        if len(obj.body) > 160:
            return obj.body[:157] + "..."
        return obj.body

    def get_area_centroid(self, obj) -> dict:
        return {
            "lat": round((obj.min_lat + obj.max_lat) / 2.0, 3),
            "lon": round((obj.min_lon + obj.max_lon) / 2.0, 3),
        }


class AdvisoryDetailSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    source = serializers.CharField(source="source.slug", read_only=True)
    bounds = serializers.SerializerMethodField()

    class Meta:
        model = Advisory
        fields = [
            "id",
            "headline",
            "body",
            "severity",
            "source",
            "issued_at",
            "expires_at",
            "source_url",
            "bounds",
            "created_at",
        ]

    def get_bounds(self, obj) -> dict:
        return {
            "min_lat": obj.min_lat,
            "max_lat": obj.max_lat,
            "min_lon": obj.min_lon,
            "max_lon": obj.max_lon,
        }
