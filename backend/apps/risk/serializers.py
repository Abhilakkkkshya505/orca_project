from rest_framework import serializers

from apps.risk.models import FishingZone, RiskAssessment


class FishingZoneSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = FishingZone
        fields = [
            "id",
            "origin",
            "score",
            "risk_level",
            "geometry",
            "factors",
        ]

    def get_geometry(self, obj) -> dict:
        return {
            "type": "Point",
            "coordinates": [obj.lon, obj.lat],
        }


class RiskAssessmentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    location = serializers.SerializerMethodField()
    fishing_zones = FishingZoneSerializer(many=True, read_only=True)
    advisories = serializers.SerializerMethodField()
    missing = serializers.SerializerMethodField()
    disclaimer = serializers.CharField(
        default="Official warnings override ORCA. Thresholds are development placeholders."
    )

    class Meta:
        model = RiskAssessment
        fields = [
            "id",
            "level",
            "location",
            "valid_from",
            "valid_to",
            "vessel_class",
            "factors",
            "advisories",
            "fishing_zones",
            "missing",
            "rules_version",
            "disclaimer",
            "created_at",
        ]

    def get_location(self, obj) -> dict:
        return {"lat": obj.lat, "lon": obj.lon}

    def get_advisories(self, obj) -> list:
        from apps.geodata.models import Advisory

        advs = Advisory.objects.filter(public_id__in=obj.advisory_ids)
        return [
            {
                "id": str(a.public_id),
                "headline": a.headline,
                "severity": a.severity,
                "source": a.source.slug,
                "expires_at": a.expires_at.isoformat(),
            }
            for a in advs
        ]

    def get_missing(self, obj) -> list[str]:
        missing = []
        for f in obj.factors:
            if f.get("level") == "unknown":
                missing.append(f.get("label", f.get("key")))
        return missing
