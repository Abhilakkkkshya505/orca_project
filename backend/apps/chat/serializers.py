"""Serializers for chat threads and streaming messages."""

from rest_framework import serializers

from apps.chat.models import Message, Thread


class MessageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "role", "content", "payload", "created_at"]
        read_only_fields = ["id", "created_at"]


class ThreadSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)

    class Meta:
        model = Thread
        fields = ["id", "title", "created_at", "last_message_at"]
        read_only_fields = ["id", "created_at", "last_message_at"]


class ThreadDetailSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Thread
        fields = ["id", "title", "created_at", "last_message_at", "messages"]
        read_only_fields = ["id", "created_at", "last_message_at", "messages"]


class ThreadCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)


class LocationInputSerializer(serializers.Serializer):
    lat = serializers.FloatField(min_value=-90.0, max_value=90.0)
    lon = serializers.FloatField(min_value=-180.0, max_value=180.0)


class ChatMessagePostSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=1000)
    location = LocationInputSerializer(required=False, allow_null=True)
    vessel_class = serializers.ChoiceField(
        choices=["small_craft", "mechanised"],
        required=False,
        default="small_craft",
    )
    turnstile_token = serializers.CharField(required=False, allow_blank=True)
