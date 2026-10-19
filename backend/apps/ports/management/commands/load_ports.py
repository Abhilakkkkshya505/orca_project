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

# ISO 3166-1 alpha-2 mapping for common countries in WPI
COUNTRY_MAP = {
    "india": "IN",
    "united states": "US",
    "china": "CN",
    "japan": "JP",
    "united kingdom": "GB",
    "germany": "DE",
    "netherlands": "NL",
    "singapore": "SG",
    "sri lanka": "LK",
    "indonesia": "ID",
    "malaysia": "MY",
    "australia": "AU",
    "canada": "CA",
    "brazil": "BR",
    "france": "FR",
    "spain": "ES",
    "italy": "IT",
    "norway": "NO",
    "south africa": "ZA",
    "russia": "RU",
    "egypt": "EG",
    "united arab emirates": "AE",
    "saudi arabia": "SA",
    "oman": "OM",
    "yemen": "YE",
    "thailand": "TH",
    "vietnam": "VN",
    "philippines": "PH",
    "bangladesh": "BD",
    "myanmar": "MM",
    "pakistan": "PK",
}


def map_port_type(harbor_type: str, main_name: str) -> str:
    ht = (harbor_type or "").lower()
    mn = main_name.lower()
    if "river" in ht or "canal" in ht:
        return Port.PortType.RIVER
    if "fish" in mn or "fishery" in mn or "fishing" in ht:
        return Port.PortType.FISHING_HARBOUR
    if "anchorage" in ht or "open roadstead" in ht:
        return Port.PortType.ANCHORAGE
    if "coastal" in ht or "commercial" in ht or "harbor" in ht or "port" in ht or "bay" in ht:
        return Port.PortType.COMMERCIAL
    return Port.PortType.COMMERCIAL


class Command(BaseCommand):
    help = "Loads World Port Index (Publication 150) ports into database idempotently."

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, default="", help="Path to WPI CSV file")
        parser.add_argument("--source", type=str, default="nga", help="Source tag (default: nga)")
        parser.add_argument("--limit", type=int, default=0, help="Optional row limit for testing")

    def handle(self, *args, **options):
        file_path_str = options["file"]
        if not file_path_str:
            file_path = getattr(settings, "BASE_DIR").parent / "data" / "ports" / "UpdatedPub150.csv"
        else:
            file_path = Path(file_path_str)

        if not file_path.exists():
            logger.error("wpi_file_not_found", path=str(file_path))
            self.stderr.write(f"File not found: {file_path}")
            sys.exit(1)

        source = options["source"]
        limit = options["limit"]

        logger.info("loading_ports_start", file=str(file_path), source=source)
        self.stdout.write(f"Reading ports from {file_path}...")

        # Preload existing slugs and existing ports for deduplication
        existing_slugs = set(Port.objects.values_list("slug", flat=True))
        existing_ports = list(Port.objects.only("id", "name_ascii", "lat", "lon", "country_code"))

        created_count = 0
        updated_count = 0
        skipped_dedupe = 0
        invalid_coords = 0

        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        if limit > 0:
            rows = rows[:limit]

        for i, row in enumerate(rows):
            raw_name = row.get("Main Port Name", "").strip()
            if not raw_name:
                continue

            try:
                lat = float(row.get("Latitude", "0"))
                lon = float(row.get("Longitude", "0"))
            except ValueError:
                invalid_coords += 1
                continue

            # Validate coordinates
            is_valid, reason = validate_coordinates(lat, lon)
            if not is_valid:
                logger.debug("invalid_coordinate_rejected", name=raw_name, lat=lat, lon=lon, reason=reason)
                invalid_coords += 1
                continue

            # Normalization
            name = normalize_name(raw_name)
            name_ascii = to_ascii(name)
            raw_alt = row.get("Alternate Port Name", "").strip()
            alt_names = extract_alt_names(raw_name, raw_alt)

            country_raw = row.get("Country Code", "").strip()
            country_code = COUNTRY_MAP.get(country_raw.lower())
            if not country_code:
                # Fallback to first 2 uppercase letters or region
                country_code = country_raw[:2].upper() if len(country_raw) >= 2 else "XX"

            wpi_number = row.get("World Port Index Number", "").strip()
            unlocode = row.get("UN/LOCODE", "").strip() or None
            harbor_size = row.get("Harbor Size", "").strip() or None
            harbor_type = row.get("Harbor Type", "").strip() or ""
            port_type = map_port_type(harbor_type, name)

            # Deduplication: check if another port with identical name is within 1 km
            is_dupe = False
            for ep in existing_ports:
                if ep.name_ascii == name_ascii and ep.country_code == country_code:
                    if haversine_km(lat, lon, ep.lat, ep.lon) < 1.0:
                        is_dupe = True
                        break
            if is_dupe:
                skipped_dedupe += 1
                continue

            # Check if port with same source_ref exists
            source_ref = f"wpi_{wpi_number}" if wpi_number else f"{name_ascii}_{country_code}"
            port = Port.objects.filter(source=source, source_ref=source_ref).first()

            if not port:
                # Generate unique slug
                admin1_name, admin1_code = resolve_admin1(lat, lon, country_code)
                slug = generate_unique_slug(name, country_code, admin1_name, existing_slugs)

                port = Port.objects.create(
                    name=name,
                    name_ascii=name_ascii,
                    alt_names=alt_names,
                    slug=slug,
                    country_code=country_code,
                    country_name=country_raw,
                    admin1_name=admin1_name,
                    admin1_code=admin1_code,
                    port_type=port_type,
                    harbour_size=harbor_size,
                    unlocode=unlocode,
                    lat=lat,
                    lon=lon,
                    source=source,
                    source_ref=source_ref,
                )
                existing_ports.append(port)
                created_count += 1
            else:
                port.name = name
                port.name_ascii = name_ascii
                port.alt_names = alt_names
                port.lat = lat
                port.lon = lon
                port.unlocode = unlocode
                port.harbour_size = harbor_size
                port.save(update_fields=["name", "name_ascii", "alt_names", "lat", "lon", "unlocode", "harbour_size"])
                updated_count += 1

            if (i + 1) % 500 == 0:
                self.stdout.write(f"Processed {i + 1}/{len(rows)} ports...")

        total_ports = Port.objects.count()
        logger.info(
            "load_ports_finished",
            created=created_count,
            updated=updated_count,
            skipped_dedupe=skipped_dedupe,
            invalid_coords=invalid_coords,
            total_now=total_ports,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed WPI load: {created_count} created, {updated_count} updated, "
                f"{skipped_dedupe} deduped, {invalid_coords} invalid rejected. Total in DB: {total_ports}"
            )
        )
