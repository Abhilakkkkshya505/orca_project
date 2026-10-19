from django.core.management.base import BaseCommand
import structlog
from apps.ports.models import Port
from apps.ports.snapping import snap_port_coordinate

logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    help = "Snaps ports to nearest valid sea grid points using Open-Meteo marine endpoint."

    def add_arguments(self, parser):
        parser.add_argument("--country", type=str, default="", help="Filter by country code (e.g. IN)")
        parser.add_argument("--slug", type=str, default="", help="Snap single port by slug")
        parser.add_argument("--limit", type=int, default=0, help="Limit number of ports to process")
        parser.add_argument("--force", action="store_true", help="Force re-snapping even if already snapped")

    def handle(self, *args, **options):
        country = options["country"]
        slug = options["slug"]
        limit = options["limit"]
        force = options["force"]

        qs = Port.objects.all()
        if slug:
            qs = qs.filter(slug=slug)
        elif country:
            qs = qs.filter(country_code=country.upper())

        if not force:
            qs = qs.filter(marine_lat__isnull=True, is_coastal=True)

        if limit > 0:
            qs = qs[:limit]

        total = qs.count()
        self.stdout.write(f"Snapping marine points for {total} ports...")

        snapped_count = 0
        offset_above_5km = 0
        inland_count = 0

        for i, port in enumerate(qs):
            marine_lat, marine_lon, offset_km, is_coastal = snap_port_coordinate(port.lat, port.lon)

            port.is_coastal = is_coastal
            if is_coastal and marine_lat is not None and marine_lon is not None:
                port.marine_lat = marine_lat
                port.marine_lon = marine_lon
                port.marine_offset_km = offset_km
                snapped_count += 1
                if offset_km > 5.0:
                    offset_above_5km += 1
                logger.info(
                    "port_snapped",
                    slug=port.slug,
                    port_lat=port.lat,
                    port_lon=port.lon,
                    marine_lat=marine_lat,
                    marine_lon=marine_lon,
                    offset_km=offset_km,
                )
            else:
                port.marine_lat = None
                port.marine_lon = None
                port.marine_offset_km = None
                inland_count += 1
                logger.info("port_inland_or_unsupported", slug=port.slug)

            port.save(update_fields=["marine_lat", "marine_lon", "marine_offset_km", "is_coastal"])

            if (i + 1) % 10 == 0 or (i + 1) == total:
                self.stdout.write(f"Processed {i + 1}/{total} ports (snapped={snapped_count}, inland={inland_count})...")

        self.stdout.write("\n=======================================================")
        self.stdout.write("MARINE SNAPPING SUMMARY")
        self.stdout.write("=======================================================")
        self.stdout.write(f"  Total ports processed : {total}")
        self.stdout.write(f"  Successfully snapped  : {snapped_count}")
        self.stdout.write(f"  Offset above 5 km     : {offset_above_5km}")
        self.stdout.write(f"  Inland / unsupported  : {inland_count}")
        self.stdout.write("=======================================================\n")
