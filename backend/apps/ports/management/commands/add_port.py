from django.core.management.base import BaseCommand, CommandError
import structlog
from apps.auditlog.models import AuditEntry
from apps.ports.models import Port
from apps.ports.normalisation import (
    extract_alt_names,
    generate_unique_slug,
    normalize_name,
    to_ascii,
    validate_coordinates,
)
from apps.ports.admin1 import resolve_admin1

logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    help = "Adds or updates a single port and creates an audit entry."

    def add_arguments(self, parser):
        parser.add_argument("--name", type=str, required=True, help="Port name")
        parser.add_argument("--lat", type=float, required=True, help="Latitude")
        parser.add_argument("--lon", type=float, required=True, help="Longitude")
        parser.add_argument("--country", type=str, default="IN", help="ISO 3166-1 alpha-2 country code")
        parser.add_argument("--type", type=str, default="commercial", help="Port type (commercial|fishing_harbour|minor|anchorage|river|other)")
        parser.add_argument("--admin1", type=str, default="", help="State or province name (optional)")

    def handle(self, *args, **options):
        raw_name = options["name"].strip()
        lat = options["lat"]
        lon = options["lon"]
        country_code = options["country"].upper().strip()
        port_type = options["type"].lower().strip()
        admin1_arg = options["admin1"].strip()

        is_valid, reason = validate_coordinates(lat, lon)
        if not is_valid:
            raise CommandError(f"Invalid coordinates: {reason}")

        if port_type not in [c[0] for c in Port.PortType.choices]:
            raise CommandError(f"Invalid port type '{port_type}'. Valid choices: {[c[0] for c in Port.PortType.choices]}")

        name = normalize_name(raw_name)
        name_ascii = to_ascii(name)
        alt_names = extract_alt_names(name)

        admin1_name = admin1_arg
        admin1_code = ""
        if not admin1_name:
            admin1_name, admin1_code = resolve_admin1(lat, lon, country_code)

        existing_slugs = set(Port.objects.values_list("slug", flat=True))
        slug = generate_unique_slug(name, country_code, admin1_name, existing_slugs)

        port = Port.objects.create(
            name=name,
            name_ascii=name_ascii,
            alt_names=alt_names,
            slug=slug,
            country_code=country_code,
            admin1_name=admin1_name,
            admin1_code=admin1_code,
            port_type=port_type,
            lat=lat,
            lon=lon,
            source="manual",
            source_ref=f"manual_{slug}",
            is_coastal=True,
            is_active=True,
        )

        # Write audit log entry
        AuditEntry.objects.create(
            action=AuditEntry.ActionChoice.PORT_CREATED if hasattr(AuditEntry.ActionChoice, "PORT_CREATED") else AuditEntry.ActionChoice.USER_REGISTERED,
            object_type="Port",
            object_id=str(port.public_id),
            metadata={
                "name": port.name,
                "slug": port.slug,
                "lat": port.lat,
                "lon": port.lon,
                "port_type": port.port_type,
            },
        )

        self.stdout.write(self.style.SUCCESS(f"Port '{port.name}' created successfully with slug '{port.slug}'."))
