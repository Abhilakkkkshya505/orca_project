import csv
import sys
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
import structlog

from apps.ports.models import Port
from apps.ports.normalisation import (
    extract_alt_names,
    generate_unique_slug,
    haversine_km,
    normalize_name,
    to_ascii,
    validate_coordinates,
)
from apps.ports.admin1 import resolve_admin1

logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    help = "Loads verified Indian fishing harbours from data/ports/india_fishing_harbours.csv."

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, default="", help="Path to fishing harbours CSV")

    def handle(self, *args, **options):
        file_path_str = options["file"]
        if not file_path_str:
            file_path = getattr(settings, "BASE_DIR").parent / "data" / "ports" / "india_fishing_harbours.csv"
        else:
            file_path = Path(file_path_str)

        if not file_path.exists():
            logger.error("fishing_harbours_file_not_found", path=str(file_path))
            self.stderr.write(f"File not found: {file_path}")
            sys.exit(1)

        self.stdout.write(f"Loading Indian fishing harbours from {file_path}...")
        existing_slugs = set(Port.objects.values_list("slug", flat=True))
        existing_ports = list(Port.objects.only("id", "name_ascii", "lat", "lon", "country_code"))

        created_count = 0
        updated_count = 0
        skipped_dedupe = 0

        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        for row in rows:
            verified = row.get("verified", "").lower() in ("true", "1", "yes")
            if not verified:
                continue

            raw_name = row.get("name", "").strip()
            if not raw_name:
                continue

            try:
                lat = float(row.get("lat", "0"))
                lon = float(row.get("lon", "0"))
            except ValueError:
                continue

            is_valid, reason = validate_coordinates(lat, lon)
            if not is_valid:
                logger.warning("invalid_fishing_harbour_coord", name=raw_name, lat=lat, lon=lon, reason=reason)
                continue

            name = normalize_name(raw_name)
            name_ascii = to_ascii(name)
            alt_names = extract_alt_names(raw_name)
            state_raw = row.get("state", "").strip()
            source_url = row.get("source_url", "").strip()

            # Deduplication: check if port closer than 1 km exists
            is_dupe = False
            for ep in existing_ports:
                if ep.country_code == "IN":
                    if haversine_km(lat, lon, ep.lat, ep.lon) < 1.0:
                        # If existing port is commercial or lacks fishing tag, add alt_names and flag
                        is_dupe = True
                        break
            if is_dupe:
                skipped_dedupe += 1
                continue

            admin1_name = state_raw
            admin1_code = ""
            if not admin1_name:
                admin1_name, admin1_code = resolve_admin1(lat, lon, "IN")

            slug = generate_unique_slug(name, "IN", admin1_name, existing_slugs)
            source_ref = f"fh_{name_ascii}"

            port, created = Port.objects.update_or_create(
                source="in_fisheries",
                source_ref=source_ref,
                defaults={
                    "name": name,
                    "name_ascii": name_ascii,
                    "alt_names": alt_names,
                    "slug": slug,
                    "country_code": "IN",
                    "country_name": "India",
                    "admin1_name": admin1_name,
                    "admin1_code": admin1_code,
                    "port_type": Port.PortType.FISHING_HARBOUR,
                    "lat": lat,
                    "lon": lon,
                    "is_coastal": True,
                    "is_active": True,
                },
            )

            if created:
                existing_ports.append(port)
                created_count += 1
            else:
                updated_count += 1

        total_in_ports = Port.objects.filter(country_code="IN").count()
        logger.info(
            "load_india_fishing_harbours_finished",
            created=created_count,
            updated=updated_count,
            skipped_dedupe=skipped_dedupe,
            total_in_db=total_in_ports,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed India fishing harbours load: {created_count} created, "
                f"{updated_count} updated, {skipped_dedupe} deduped. Total India ports: {total_in_ports}"
            )
        )
