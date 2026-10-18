"""Management command to cleanly delete a user and associated personal data."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.auditlog.models import log_audit

User = get_user_model()


class Command(BaseCommand):
    help = "Permanently delete a user account and associated personal data."

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Email of the user to delete")
        parser.add_argument("--confirm", action="store_true", help="Confirm deletion")

    def handle(self, *args, **options):
        email = options.get("email")
        confirm = options.get("confirm")
        if not email:
            raise CommandError("Please specify --email")
        if not confirm:
            raise CommandError("Must specify --confirm to permanently delete user data.")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError(f"User {email} not found.")

        user_id = str(user.public_id)
        user.delete()

        log_audit(
            actor=None,
            action="user_deleted_admin",
            object_type="User",
            object_id=user_id,
            details={"email": email},
        )

        self.stdout.write(self.style.SUCCESS(f"User {email} ({user_id}) permanently deleted."))
