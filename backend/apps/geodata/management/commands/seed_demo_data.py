"""Seed demo data for local and staging environments.

Refuses to execute in production (ENVIRONMENT=production).
Creates:
- Demo verified user (demo@orca.example)
- Coastal GridCells and DataSources
- Saved locations on Indian coast (Kochi, Vizhinjam, Mangaluru)
- Synthetic snapshots (caution and unsafe conditions for UI validation)
- Sample official advisories
"""

from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.geodata.models import Advisory, DataSource, ForecastSnapshot, GridCell
from apps.locations.models import AlertSubscription, SavedLocation

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo coastal data, user accounts, and test scenarios."

    def handle(self, *args, **options):
        env = getattr(settings, "ENVIRONMENT", "dev")
        if env == "production":
            raise CommandError("Refusing to seed demo data in PRODUCTION environment!")

        self.stdout.write(self.style.WARNING("Seeding demo data for ORCA..."))

        # 1. Data Sources
        sources_meta = [
            ("open_meteo", "Open-Meteo Marine & Weather", True, 60),
            ("copernicus", "Copernicus Marine Service", False, 360),
            ("nasa", "NASA Ocean Color (MODIS/VIIRS)", False, 720),
            ("incois", "INCOIS Coastal Advisories", True, 180),
        ]
        source_objs = {}
        for slug, name, enabled, poll in sources_meta:
            src, _ = DataSource.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "is_enabled": enabled, "expected_interval_minutes": poll},
            )
            source_objs[slug] = src
        self.stdout.write(self.style.SUCCESS(f"Configured {len(source_objs)} data sources."))

        # 2. Demo User
        demo_email = "demo@orca.example"
        demo_user, created = User.objects.get_or_create(
            email=demo_email,
            defaults={
                "display_name": "Demo Fisher",
                "is_email_verified": True,
                "default_vessel_class": "small_craft",
            },
        )
        if created:
            demo_user.set_password("DemoPassword123!")
            demo_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created demo user: {demo_email}"))

        # 3. Grid Cells along Indian West Coast
        cells_data = [
            (9.97, 76.24, "Fort Kochi"),
            (8.38, 76.99, "Vizhinjam Harbour"),
            (12.87, 74.84, "New Mangalore"),
            (15.40, 73.80, "Mormugao"),
        ]
        created_cells = {}
        for lat, lon, name in cells_data:
            cell, _ = GridCell.objects.get_or_create(
                lat=round(lat, 2),
                lon=round(lon, 2),
                defaults={"resolution_deg": 0.25},
            )
            created_cells[name] = cell

        # 4. Saved Locations for Demo User
        for name, cell in created_cells.items():
            loc, _ = SavedLocation.objects.get_or_create(
                user=demo_user,
                name=name,
                defaults={"lat": cell.lat, "lon": cell.lon, "kind": "harbour"},
            )
            # Create alert subscription
            AlertSubscription.objects.get_or_create(
                user=demo_user,
                location=loc,
                defaults={"min_level": "caution", "email_notifications": True},
            )

        # 5. Synthetic Snapshots for next 48 hours
        # One safe, one caution, one unsafe
        now = timezone.now()
        open_meteo_src = source_objs["open_meteo"]

        # Cell 1: Kochi -> Safe / moderate
        # Cell 2: Vizhinjam -> Caution (elevated wave height)
        # Cell 3: Mangalore -> Unsafe (high swell and wind)
        scenarios = {
            "Fort Kochi": {
                "wave_height": 1.2,
                "wind_speed": 18.0,
                "gust": 25.0,
                "rain_prob": 10.0,
                "wave_period": 7.0,
            },
            "Vizhinjam Harbour": {
                "wave_height": 1.9,  # Caution for small_craft (>1.5m)
                "wind_speed": 26.0,
                "gust": 35.0,
                "rain_prob": 40.0,
                "wave_period": 10.0,
            },
            "New Mangalore": {
                "wave_height": 2.8,  # Unsafe for small_craft (>2.5m)
                "wind_speed": 42.0,  # Unsafe (>40 km/h)
                "gust": 55.0,
                "rain_prob": 80.0,
                "wave_period": 14.0,
            },
            "Mormugao": {
                "wave_height": 1.1,
                "wind_speed": 15.0,
                "gust": 20.0,
                "rain_prob": 5.0,
                "wave_period": 6.5,
            },
        }

        for loc_name, vals in scenarios.items():
            cell = created_cells[loc_name]
            for hour_offset in range(0, 48, 3):
                v_time = now + timedelta(hours=hour_offset)
                snapshot_vals = {
                    **vals,
                    "_synthetic": True,
                }
                ForecastSnapshot.objects.update_or_create(
                    cell=cell,
                    source=open_meteo_src,
                    valid_time=v_time,
                    defaults={
                        "issued_at": now,
                        "values": snapshot_vals,
                    },
                )
        self.stdout.write(self.style.SUCCESS("Seeded synthetic time-series snapshots (48h)."))

        # 6. Sample Official Advisories
        headline_1 = "High Swell Surge Alert for Kerala and South Karnataka Coast"
        body_1 = (
            "INCOIS has issued a high swell surge alert. Waves between 2.5 to 3.2 meters "
            "are expected along the coastal stretches from Vizhinjam to Mangaluru. "
            "Fishermen and small craft operators are advised to exercise extreme caution."
        )
        Advisory.objects.get_or_create(
            external_id="INCOIS-SW-2026-001",
            defaults={
                "source": source_objs["incois"],
                "headline": headline_1,
                "body": body_1,
                "severity": "watch",
                "issued_at": now - timedelta(hours=2),
                "expires_at": now + timedelta(hours=36),
                "source_url": "https://incois.gov.in/portal/osf/alerts",
                "min_lat": 8.0,
                "max_lat": 13.5,
                "min_lon": 74.0,
                "max_lon": 77.5,
                "content_hash": Advisory.compute_content_hash(headline_1, body_1, "watch"),
            },
        )

        headline_2 = "Squally Weather Advisory for Lakshadweai/Arabian Sea"
        body_2 = (
            "Squally weather with wind speed reaching 45-55 kmph gusting to 65 kmph is very likely. "
            "Fishermen are advised not to venture into these sea areas."
        )
        Advisory.objects.get_or_create(
            external_id="INCOIS-SW-2026-002",
            defaults={
                "source": source_objs["incois"],
                "headline": headline_2,
                "body": body_2,
                "severity": "warning",
                "issued_at": now - timedelta(hours=1),
                "expires_at": now + timedelta(hours=24),
                "source_url": "https://incois.gov.in/portal/osf/alerts",
                "min_lat": 9.0,
                "max_lat": 12.0,
                "min_lon": 71.0,
                "max_lon": 74.5,
                "content_hash": Advisory.compute_content_hash(headline_2, body_2, "warning"),
            },
        )
        self.stdout.write(self.style.SUCCESS("Seeded sample official bulletins."))
        self.stdout.write(self.style.SUCCESS("Demo data seeding completed successfully!"))
