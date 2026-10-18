"""Management command to prune aged forecasts, inactive guest threads, and historical risk assessments."""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.chat.models import Thread
from apps.geodata.models import ForecastSnapshot
from apps.risk.models import RiskAssessment


class Command(BaseCommand):
    help = "Prune data according to data retention policies (14-day snapshots, 30-day guest threads)."

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. Prune ForecastSnapshot older than 14 days past valid_time
        snapshot_cutoff = now - timedelta(days=14)
        del_snapshots, _ = ForecastSnapshot.objects.filter(valid_time__lt=snapshot_cutoff).delete()
        self.stdout.write(f"Pruned {del_snapshots} expired forecast snapshots.")

        # 2. Prune inactive guest threads (> 30 days) or soft-deleted threads (> 30 days)
        thread_cutoff = now - timedelta(days=30)
        del_threads, _ = Thread.objects.filter(
            user__isnull=True,
            last_message_at__lt=thread_cutoff,
        ).delete()
        del_soft, _ = Thread.objects.filter(
            is_deleted=True,
            updated_at__lt=thread_cutoff,
        ).delete()
        self.stdout.write(f"Pruned {del_threads} guest threads and {del_soft} soft-deleted threads.")

        # 3. Prune guest RiskAssessment (> 90 days)
        risk_cutoff = now - timedelta(days=90)
        del_risk, _ = RiskAssessment.objects.filter(
            user__isnull=True,
            created_at__lt=risk_cutoff,
        ).delete()
        self.stdout.write(f"Pruned {del_risk} guest risk assessments.")

        self.stdout.write(self.style.SUCCESS("Retention pruning complete."))
