from datetime import datetime, timezone as py_timezone
from django.core.management.base import BaseCommand
from django.utils import timezone
import requests
import structlog

from apps.geodata.models import DataSource, ForecastSnapshot, GridCell
from apps.ports.models import Port

logger = structlog.get_logger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
OPEN_METEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


class Command(BaseCommand):
    help = "Ingests hourly marine and weather forecast variables for ports deduplicated by 0.1° grid cells."

    def add_arguments(self, parser):
        parser.add_argument("--country", type=str, default="", help="Filter by country code (e.g. IN)")
        parser.add_argument("--slug", type=str, default="", help="Filter by port slug")
        parser.add_argument("--limit", type=int, default=0, help="Max ports to ingest")
        parser.add_argument("--dry-run", action="store_true", help="Inspect grid cells and planned requests without calling API")

    def handle(self, *args, **options):
        country = options["country"]
        slug = options["slug"]
        limit = options["limit"]
        dry_run = options["dry_run"]

        qs = Port.objects.filter(is_active=True, is_coastal=True)
        if slug:
            qs = qs.filter(slug=slug)
        elif country:
            qs = qs.filter(country_code=country.upper())

        # Prioritize ports with marine points already snapped
        qs = qs.order_by("-marine_lat")

        if limit > 0:
            qs = qs[:limit]

        ports = list(qs)
        total_ports = len(ports)
        if not ports:
            self.stdout.write(self.style.WARNING("No matching ports found to ingest."))
            return

        self.stdout.write(f"Targeting {total_ports} ports for ingestion...")

        # E2. Grid cell deduplication (0.1 degree grid resolution ~10km)
        cell_to_ports: dict[tuple[float, float], list[Port]] = {}
        for p in ports:
            lat = p.marine_lat if p.marine_lat is not None else p.lat
            lon = p.marine_lon if p.marine_lon is not None else p.lon
            cell_key = (round(lat, 1), round(lon, 1))
            cell_to_ports.setdefault(cell_key, []).append(p)

        unique_cells = list(cell_to_ports.keys())
        self.stdout.write(
            f"Deduplicated {total_ports} ports to {len(unique_cells)} unique 0.1° grid cells "
            f"({total_ports - len(unique_cells)} redundant API calls avoided)."
        )

        if dry_run:
            self.stdout.write(self.style.SUCCESS("[DRY-RUN] Grid cell deduplication plan:"))
            for cell_lat, cell_lon in unique_cells[:10]:
                mapped = [p.name for p in cell_to_ports[(cell_lat, cell_lon)]]
                self.stdout.write(f"  Cell ({cell_lat:.1f}, {cell_lon:.1f}) -> {len(mapped)} ports: {', '.join(mapped[:3])}")
            return

        ds, _ = DataSource.objects.get_or_create(
            slug="open_meteo",
            defaults={"name": "Open-Meteo Marine & Weather", "is_enabled": True},
        )

        now = timezone.now()
        total_snapshots_saved = 0

        # Batch in chunks of up to 10 cells to respect URL length and API constraints
        batch_size = 10
        for b_idx in range(0, len(unique_cells), batch_size):
            batch = unique_cells[b_idx : b_idx + batch_size]
            lats_str = ",".join(f"{c[0]:.4f}" for c in batch)
            lons_str = ",".join(f"{c[1]:.4f}" for c in batch)

            # 1. Fetch marine variables
            m_params = {
                "latitude": lats_str,
                "longitude": lons_str,
                "hourly": "wave_height,wave_period,wave_direction",
                "forecast_days": 7,
            }
            try:
                m_resp = requests.get(
                    OPEN_METEO_MARINE_URL,
                    params=m_params,
                    headers={"User-Agent": "ORCA-Ingest/1.0"},
                    timeout=10.0,
                )
                m_data = m_resp.json() if m_resp.status_code == 200 else []
            except Exception as e:
                logger.warning(f"Marine batch fetch error: {e}")
                m_data = []

            # 2. Fetch atmospheric weather variables
            w_params = {
                "latitude": lats_str,
                "longitude": lons_str,
                "hourly": "wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation",
                "forecast_days": 7,
            }
            try:
                w_resp = requests.get(
                    OPEN_METEO_WEATHER_URL,
                    params=w_params,
                    headers={"User-Agent": "ORCA-Ingest/1.0"},
                    timeout=10.0,
                )
                w_data = w_resp.json() if w_resp.status_code == 200 else []
            except Exception as e:
                logger.warning(f"Weather batch fetch error: {e}")
                w_data = []

            m_items = m_data if isinstance(m_data, list) else ([m_data] if isinstance(m_data, dict) and "hourly" in m_data else [])
            w_items = w_data if isinstance(w_data, list) else ([w_data] if isinstance(w_data, dict) and "hourly" in w_data else [])

            for i, (c_lat, c_lon) in enumerate(batch):
                cell, _ = GridCell.objects.get_or_create(lat=c_lat, lon=c_lon, defaults={"resolution_deg": 0.1})

                m_h = m_items[i].get("hourly", {}) if i < len(m_items) else {}
                w_h = w_items[i].get("hourly", {}) if i < len(w_items) else {}

                times = m_h.get("time") or w_h.get("time") or []
                wh = m_h.get("wave_height", [])
                wp = m_h.get("wave_period", [])
                wd = m_h.get("wave_direction", [])
                ws = w_h.get("wind_speed_10m", [])
                wg = w_h.get("wind_gusts_10m", [])
                rn = w_h.get("precipitation", [])

                for t_idx, t_str in enumerate(times):
                    vt = datetime.fromisoformat(t_str).replace(tzinfo=py_timezone.utc)
                    vals = {}
                    if t_idx < len(wh) and wh[t_idx] is not None:
                        vals["wave_height_m"] = float(wh[t_idx])
                    if t_idx < len(wp) and wp[t_idx] is not None:
                        vals["wave_period_s"] = float(wp[t_idx])
                    if t_idx < len(wd) and wd[t_idx] is not None:
                        vals["wave_direction_deg"] = float(wd[t_idx])
                    if t_idx < len(ws) and ws[t_idx] is not None:
                        vals["wind_speed_kmh"] = float(ws[t_idx])
                    if t_idx < len(wg) and wg[t_idx] is not None:
                        vals["wind_gust_kmh"] = float(wg[t_idx])
                    if t_idx < len(rn) and rn[t_idx] is not None:
                        vals["rain_mm"] = float(rn[t_idx])

                    ForecastSnapshot.objects.update_or_create(
                        cell=cell,
                        source=ds,
                        valid_time=vt,
                        issued_at=now,
                        defaults={"values": vals},
                    )
                    total_snapshots_saved += 1

            self.stdout.write(f"Processed batch {min(b_idx + batch_size, len(unique_cells))}/{len(unique_cells)} cells...")

        ds.last_success_at = now
        ds.last_error = ""
        ds.save(update_fields=["last_success_at", "last_error"])

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully completed ingestion: saved {total_snapshots_saved} snapshots "
                f"across {len(unique_cells)} grid cells covering {total_ports} ports."
            )
        )
