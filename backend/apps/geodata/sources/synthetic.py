"""
Synthetic scenario generator (dev / test only).
Generates plausible calm, moderate, and storm oceanographic scenarios for demo ports.
BLOCKED when ENVIRONMENT=production.
Always sets synthetic=True.
"""

from datetime import datetime, timedelta, timezone
import os
from django.conf import settings

from apps.geodata.contracts import NormalizedTelemetry
from apps.geodata.sources.base import BaseAdapter, RawRecord


class SyntheticGenerator(BaseAdapter):
    slug = "synthetic"
    name = "Synthetic Scenario Generator (Dev Only)"

    def is_production(self) -> bool:
        env_setting = getattr(settings, "ENVIRONMENT", "").lower()
        env_var = os.environ.get("ENVIRONMENT", "").lower()
        return env_setting in ("production", "prod") or env_var in ("production", "prod")

    def generate_scenario(
        self,
        scenario_type: str,  # "calm", "moderate", "storm"
        lat: float,
        lon: float,
        forecast_days: int = 3,
    ) -> list[NormalizedTelemetry]:
        """
        Generates hourly synthetic forecast snapshots.
        STRICTLY BLOCKED in production environment.
        """
        if self.is_production():
            raise PermissionError("Synthetic scenario generator is strictly blocked in production.")

        now = datetime.now(timezone.utc)
        records = []

        if scenario_type == "calm":
            base_wh, base_wp, base_ws, base_wg, base_rain = 0.8, 8.5, 12.0, 18.0, 0.0
        elif scenario_type == "moderate":
            base_wh, base_wp, base_ws, base_wg, base_rain = 1.8, 5.5, 32.0, 42.0, 8.0
        else:  # storm
            base_wh, base_wp, base_ws, base_wg, base_rain = 3.8, 4.2, 58.0, 75.0, 35.0

        total_hours = forecast_days * 24
        for h in range(total_hours):
            valid_time = now + timedelta(hours=h)
            # Diurnal sinusoidal variation
            factor = 1.0 + (0.15 * (h % 24 - 12) / 12.0)
            wh = round(base_wh * factor, 2)
            wp = round(base_wp / factor, 1)
            ws = round(base_ws * factor, 1)
            wg = round(base_wg * factor, 1)
            rain = round(base_rain * (1.0 if h % 6 == 0 else 0.2), 1)

            rec = NormalizedTelemetry(
                source_slug=self.slug,
                valid_time=valid_time,
                issued_at=now,
                quality_flags=["model_only"],
                wave_height_m=wh,
                wave_period_s=wp,
                wind_speed_kmh=ws,
                wind_gust_kmh=wg,
                precipitation_mm_h=rain,
                visibility_m=5000.0 if scenario_type != "storm" else 800.0,
                pressure_hpa=1012.0 if scenario_type != "storm" else 992.0,
            )
            records.append(rec)

        return records

    def fetch(self, lat: float, lon: float, since: datetime | None = None) -> list[RawRecord]:
        if self.is_production():
            raise PermissionError("Synthetic scenario generator is strictly blocked in production.")
        return []

    def normalise(self, raw: RawRecord) -> list[NormalizedTelemetry]:
        return []
