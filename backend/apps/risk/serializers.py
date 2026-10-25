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
    marine_location = serializers.SerializerMethodField()
    offset_message = serializers.SerializerMethodField()
    fishing_zones = FishingZoneSerializer(many=True, read_only=True)
    advisories = serializers.SerializerMethodField()
    missing = serializers.SerializerMethodField()
    hourly = serializers.SerializerMethodField()
    disclaimer = serializers.CharField(
        default="Official warnings override ORCA. Thresholds are development placeholders."
    )

    class Meta:
        model = RiskAssessment
        fields = [
            "id",
            "level",
            "location",
            "marine_location",
            "marine_offset_km",
            "offset_message",
            "source_mode",
            "port_slug",
            "valid_from",
            "valid_to",
            "vessel_class",
            "factors",
            "advisories",
            "fishing_zones",
            "missing",
            "hourly",
            "rules_version",
            "disclaimer",
            "created_at",
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

    def get_hourly(self, obj) -> list[dict]:
        from apps.geodata.services import get_snapshots_for_point_window

        sea_lat = obj.marine_lat if obj.marine_lat is not None else obj.lat
        sea_lon = obj.marine_lon if obj.marine_lon is not None else obj.lon
        snapshots = get_snapshots_for_point_window(sea_lat, sea_lon, obj.valid_from, obj.valid_to)

        points = []
        for s in snapshots:
            v = s.values or {}
            wh = v.get("wave_height_m")
            wp = v.get("wave_period_s")
            sw2 = v.get("secondary_swell_wave_height_m")
            ww = v.get("wind_wave_height_m")
            sl = v.get("sea_level_height_msl_m")

            if wh is not None:
                if wh < 0.1:
                    scale, cond = 0, "Calm (glassy)"
                elif wh < 0.5:
                    scale, cond = 1, "Calm (rippled)"
                elif wh < 1.25:
                    scale, cond = 2, "Smooth (wavelets)"
                elif wh < 2.5:
                    scale, cond = 3, "Slight"
                elif wh < 4.0:
                    scale, cond = 4, "Moderate"
                elif wh < 6.0:
                    scale, cond = 5, "Rough"
                elif wh < 9.0:
                    scale, cond = 6, "Very rough"
                else:
                    scale, cond = 7, "High"
            else:
                scale, cond = 2, "Moderate"

            points.append({
                "valid_time": s.valid_time.isoformat(),
                "time_label": s.valid_time.strftime("%a %H:%M"),
                "wave_height_m": round(wh, 2) if wh is not None else None,
                "wave_direction_deg": v.get("wave_direction_deg"),
                "wave_period_s": round(wp, 1) if wp is not None else None,
                "wind_wave_height_m": round(ww, 2) if ww is not None else None,
                "wind_wave_direction_deg": v.get("wind_wave_direction_deg"),
                "wind_wave_period_s": round(v.get("wind_wave_period_s", 0.0), 1) if v.get("wind_wave_period_s") else None,
                "secondary_swell_m": round(sw2, 2) if sw2 is not None else None,
                "sea_level_msl_m": round(sl, 2) if sl is not None else None,
                "wind_speed_kmh": round(v.get("wind_speed_kmh", 0.0), 1) if v.get("wind_speed_kmh") else None,
                "wind_gust_kmh": round(v.get("wind_gust_kmh", 0.0), 1) if v.get("wind_gust_kmh") else None,
                "wind_direction_deg": v.get("wind_direction_deg"),
                "rain_mm": round(v.get("rain_mm", 0.0), 1) if v.get("rain_mm") else None,
                "douglas_scale": scale,
                "sea_condition": cond,
                "cross_sea_warning": bool(sw2 and ww and sw2 >= 1.0 and ww >= 1.0),
            })
        return points
