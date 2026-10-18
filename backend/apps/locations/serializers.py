"""Serializers for SavedLocation and AlertSubscription."""

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from apps.locations.models import AlertSubscription, SavedLocation


class SavedLocationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)

    class Meta:
        model = SavedLocation
        fields = ["id", "name", "lat", "lon", "kind", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        if not (1 <= len(value.strip()) <= 60):
            raise ValidationError("Name must be between 1 and 60 characters.")
        return value.strip()

    def validate(self, attrs):
        user = self.context["request"].user
        if self.instance is None:
            # Check maximum 20 locations per user
            if SavedLocation.objects.filter(user=user).count() >= 20:
                raise ValidationError({"non_field_errors": ["Maximum 20 saved locations allowed per user."]})
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        return SavedLocation.objects.create(user=user, **validated_data)


class AlertSubscriptionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    location_id = serializers.UUIDField(write_only=True)
    location = SavedLocationSerializer(read_only=True)

    class Meta:
        model = AlertSubscription
        fields = [
            "id",
            "location_id",
            "location",
            "min_level",
            "is_active",
            "email_notifications",
            "created_at",
        ]
        read_only_fields = ["id", "location", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        loc_uuid = validated_data.pop("location_id")
        try:
            location = SavedLocation.objects.get(public_id=loc_uuid, user=user)
        except SavedLocation.DoesNotExist:
            raise ValidationError({"location_id": "Location not found."})

        subscription, _ = AlertSubscription.objects.update_or_create(
            user=user,
            location=location,
            defaults=validated_data,
        )
        return subscription
