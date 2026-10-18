"""Management command to evaluate coastal alerts for active user subscriptions."""

from django.core.management.base import BaseCommand

from apps.locations.tasks import evaluate_alerts_task


class Command(BaseCommand):
    help = "Evaluate alert thresholds across all active user location subscriptions."

    def handle(self, *args, **options):
        self.stdout.write("Running alert evaluations...")
        result = evaluate_alerts_task()
        self.stdout.write(self.style.SUCCESS(f"Evaluation finished: {result}"))
