from django.contrib.auth import get_user_model, password_validation
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public representation of an authenticated user."""

    id = serializers.UUIDField(source="public_id", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "is_email_verified",
            "preferred_units",
            "default_vessel_class",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_email_verified", "created_at"]


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    display_name = serializers.CharField(min_length=1, max_length=80)
    password = serializers.CharField(write_only=True, min_length=10)
    turnstile_token = serializers.CharField(required=True)
    accepted_terms = serializers.BooleanField(required=True)
    terms_version = serializers.CharField(required=False, default="2026.1")
    claim_guest_threads = serializers.BooleanField(required=False, default=False)

    def validate_accepted_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms and Conditions and Privacy Policy.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def validate_email(self, value):
        return value.lower().strip()


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    turnstile_token = serializers.CharField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True)
    turnstile_token = serializers.CharField(required=True)
    claim_guest_threads = serializers.BooleanField(required=False, default=False)

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    turnstile_token = serializers.CharField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, min_length=10)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, min_length=10, required=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "display_name",
            "preferred_units",
            "default_vessel_class",
        ]


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
