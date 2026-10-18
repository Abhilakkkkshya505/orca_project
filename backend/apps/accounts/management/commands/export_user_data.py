"""Management command to export all user data for GDPR/DPDP compliance."""

import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.chat.models import Thread
from apps.locations.models import AlertSubscription, SavedLocation
from apps.risk.models import RiskAssessment

User = get_user_model()


class Command(BaseCommand):
    help = "Export all personal data for a user in structured JSON."

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Email of the user to export")

    def handle(self, *args, **options):
        email = options.get("email")
        if not email:
            raise CommandError("Please provide --email")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError(f"User with email {email} does not exist.")

        # Aggregate data
        locations = list(SavedLocation.objects.filter(user=user).values("name", "lat", "lon", "kind", "created_at"))
        subscriptions = list(
            AlertSubscription.objects.filter(user=user).values(
                "location__name", "min_level", "is_active", "email_notifications", "created_at"
            )
        )
        threads_data = []
        for t in Thread.objects.filter(user=user):
            msgs = list(t.messages.values("role", "content", "created_at"))
            threads_data.append({"thread_id": str(t.public_id), "title": t.title, "messages": msgs})

        assessments = list(
            RiskAssessment.objects.filter(user=user).values(
                "level", "lat", "lon", "valid_from", "valid_to", "vessel_class", "factors", "created_at"
            )
        )

        data = {
            "user": {
                "id": str(user.public_id),
                "email": user.email,
                "display_name": user.display_name,
                "preferred_units": user.preferred_units,
                "default_vessel_class": user.default_vessel_class,
                "created_at": user.created_at.isoformat(),
            },
            "saved_locations": locations,
            "alert_subscriptions": subscriptions,
            "chat_threads": threads_data,
            "risk_assessments": assessments,
        }

        self.stdout.write(json.dumps(data, indent=2, default=str))
