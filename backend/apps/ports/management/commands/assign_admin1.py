from django.core.management.base import BaseCommand
from django.db.models import Count
import structlog

from apps.ports.models import Port
from apps.ports.admin1 import resolve_admin1

logger = structlog.get_logger(__name__)

INDIAN_COASTAL_STATES = [
    "Gujarat",
    "Maharashtra",
    "Goa",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Puducherry",
    "Andhra Pradesh",
    "Odisha",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Lakshadweep",
    "Daman and Diu",
    "Dadra and Nagar Haveli and Daman and Diu",
]


class Command(BaseCommand):
    help = "Assigns admin1 (state/province) to ports using Natural Earth Admin-1 polygons and prints Indian coastal stats."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Reassign admin1 for all ports even if already set")
        parser.add_argument("--country", type=str, default="", help="Optional country code filter e.g. IN")

    def handle(self, *args, **options):
        force = options["force"]
        country = options["country"]

        qs = Port.objects.all()
        if country:
            qs = qs.filter(country_code=country.upper())
        if not force:
            qs = qs.filter(admin1_name="")

        total = qs.count()
        self.stdout.write(f"Assigning admin1 for {total} ports...")

        updated = 0
        for i, port in enumerate(qs):
            state_name, state_code = resolve_admin1(port.lat, port.lon, port.country_code)
            if state_name:
                port.admin1_name = state_name
                port.admin1_code = state_code
                port.save(update_fields=["admin1_name", "admin1_code"])
                updated += 1

            if (i + 1) % 500 == 0:
                self.stdout.write(f"Processed {i + 1}/{total} ports...")

        self.stdout.write(self.style.SUCCESS(f"Assigned admin1 for {updated} ports."))

        # Print per-state count for Indian coastal states & UTs
        self.stdout.write("\n=======================================================")
        self.stdout.write("INDIAN COASTAL STATES & UNION TERRITORIES PORT REPORT")
        self.stdout.write("=======================================================")

        state_counts = (
            Port.objects.filter(country_code="IN")
            .values("admin1_name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        counts_dict = {item["admin1_name"]: item["count"] for item in state_counts}

        flagged = []
        for state in [
            "Gujarat",
            "Maharashtra",
            "Goa",
            "Karnataka",
            "Kerala",
            "Tamil Nadu",
            "Puducherry",
            "Andhra Pradesh",
            "Odisha",
            "West Bengal",
            "Andaman and Nicobar Islands",
            "Lakshadweep",
            "Dadra and Nagar Haveli and Daman and Diu",
        ]:
            cnt = counts_dict.get(state, 0)
            status_flag = "OK" if cnt >= 3 else "FLAG (<3 ports)"
            if cnt < 3:
                flagged.append((state, cnt))
            self.stdout.write(f"  {state:<42}: {cnt:>3} ports [{status_flag}]")

        if flagged:
            self.stdout.write(
                self.style.WARNING(f"\nWarning: {len(flagged)} coastal state(s)/UT(s) have fewer than 3 ports.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("\nAll Indian coastal states and UTs meet the minimum requirement (>=3 ports)!")
            )
