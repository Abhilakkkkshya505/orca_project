"""Management command to ingest a specific data source."""

from django.core.management.base import BaseCommand, CommandError

from apps.geodata.models import DataSource
from apps.geodata.tasks import ingest_source_task


class Command(BaseCommand):
    help = "Ingest data from a specific provider source."

    def add_arguments(self, parser):
        parser.add_argument("source_slug", type=str, help="Slug of the data source (e.g., open_meteo, copernicus)")

    def handle(self, *args, **options):
        slug = options["source_slug"]
        try:
            src = DataSource.objects.get(slug=slug)
        except DataSource.DoesNotExist:
            raise CommandError(f"Data source '{slug}' does not exist.")

        self.stdout.write(f"Ingesting source '{src.slug}'...")
        res = ingest_source_task(src.slug)
        self.stdout.write(self.style.SUCCESS(f"Result: {res}"))
