"""Management command to trigger ingestion for all enabled data sources."""

from django.core.management.base import BaseCommand

from apps.geodata.models import DataSource
from apps.geodata.tasks import ingest_source_task


class Command(BaseCommand):
    help = "Trigger ingestion for all enabled data sources."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sync",
            action="store_true",
            help="Execute ingestion synchronously without Celery.",
        )

    def handle(self, *args, **options):
        sources = DataSource.objects.filter(is_enabled=True)
        self.stdout.write(f"Found {sources.count()} enabled data sources.")

        for src in sources:
            self.stdout.write(f"Triggering ingestion for {src.slug}...")
            if options.get("sync"):
                ingest_source_task(src.slug)
            else:
                ingest_source_task.delay(src.slug)

        self.stdout.write(self.style.SUCCESS("All ingestions dispatched."))
