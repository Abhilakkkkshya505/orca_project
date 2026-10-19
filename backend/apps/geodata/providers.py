"""
Provider Registry for ORCA data sources.
Defines metadata, credentials detection, rate limits, and attribution for all external providers.
"""

from dataclasses import dataclass
from typing import Optional
from django.conf import settings
import os


@dataclass
class ProviderMetadata:
    slug: str
    name: str
    needs_key: bool
    is_configured: bool
    attribution: str
    license_url: str
    rate_limit_policy: str
    default_refresh_interval_minutes: int
    status: str  # ok | stale | failing | disabled (no key)
    notes: str = ""


class ProviderRegistry:
    @staticmethod
    def get_providers() -> list[ProviderMetadata]:
        providers = []

        # 1. Open-Meteo Marine Weather
        providers.append(
            ProviderMetadata(
                slug="open_meteo_marine",
                name="Open-Meteo Marine Weather",
                needs_key=False,
                is_configured=True,
                attribution="Marine weather data from Open-Meteo.com under CC-BY 4.0 with DWD and NOAA models.",
                license_url="https://open-meteo.com/en/terms",
                rate_limit_policy="10,000 requests/day non-commercial tier",
                default_refresh_interval_minutes=60,
                status="ok",
                notes="Non-commercial tier requires no API key. DWD attribution required.",
            )
        )

        # 2. Open-Meteo Weather Forecast
        providers.append(
            ProviderMetadata(
                slug="open_meteo_forecast",
                name="Open-Meteo Atmospheric Forecast",
                needs_key=False,
                is_configured=True,
                attribution="Atmospheric wind and weather forecasts from Open-Meteo.com (CC-BY 4.0).",
                license_url="https://open-meteo.com/en/terms",
                rate_limit_policy="10,000 requests/day non-commercial tier",
                default_refresh_interval_minutes=60,
                status="ok",
                notes="Free public endpoint.",
            )
        )

        # 3. Open-Meteo Geocoding
        providers.append(
            ProviderMetadata(
                slug="open_meteo_geocoding",
                name="Open-Meteo Coastal Geocoding",
                needs_key=False,
                is_configured=True,
                attribution="Geocoding data from Open-Meteo under CC-BY 4.0 with OpenStreetMap contributors.",
                license_url="https://open-meteo.com/en/terms",
                rate_limit_policy="10,000 requests/day non-commercial tier",
                default_refresh_interval_minutes=1440,
                status="ok",
                notes="Free public search endpoint.",
            )
        )

        # 4. NOAA CoastWatch ERDDAP
        erddap_url = getattr(settings, "NOAA_ERDDAP_BASE_URL", "https://coastwatch.pfeg.noaa.gov/erddap")
        providers.append(
            ProviderMetadata(
                slug="noaa_erddap",
                name="NOAA CoastWatch ERDDAP",
                needs_key=False,
                is_configured=bool(erddap_url),
                attribution="Satellite SST and Chlorophyll telemetry provided by NOAA CoastWatch / OceanWatch.",
                license_url="https://coastwatch.pfeg.noaa.gov/erddap/information.html",
                rate_limit_policy="Public academic access; polite rate limiting enforced",
                default_refresh_interval_minutes=360,
                status="ok" if bool(erddap_url) else "disabled (no url)",
                notes="Direct REST API access to global ocean satellite datasets without authentication.",
            )
        )

        # 5. Copernicus Marine Service
        copernicus_user = os.environ.get("COPERNICUSMARINE_USERNAME", "")
        copernicus_pass = os.environ.get("COPERNICUSMARINE_PASSWORD", "")
        copernicus_configured = bool(copernicus_user and copernicus_pass)
        providers.append(
            ProviderMetadata(
                slug="copernicus",
                name="Copernicus Marine Service",
                needs_key=True,
                is_configured=copernicus_configured,
                attribution="E.U. Copernicus Marine Service Information.",
                license_url="https://marine.copernicus.eu/user-corner/service-commitments-and-licence",
                rate_limit_policy="Standard registered quota (free academic license)",
                default_refresh_interval_minutes=720,
                status="ok" if copernicus_configured else "disabled (no key)",
                notes="Requires free registered account at marine.copernicus.eu for deep satellite feeds.",
            )
        )

        # 6. Global Fishing Watch
        gfw_token = os.environ.get("GFW_API_ACCESS_TOKEN", "")
        gfw_configured = bool(gfw_token)
        providers.append(
            ProviderMetadata(
                slug="gfw",
                name="Global Fishing Watch (GFW)",
                needs_key=True,
                is_configured=gfw_configured,
                attribution="Global Fishing Watch API v3 used under non-commercial research licence.",
                license_url="https://globalfishingwatch.org/our-apis/tokens",
                rate_limit_policy="10 req/s, 10,000 monthly credits",
                default_refresh_interval_minutes=1440,
                status="ok" if gfw_configured else "disabled (no key)",
                notes="Bearer token required for vessel AIS and fishing activity endpoints.",
            )
        )

        # 7. GDACS Global Disaster Alert System
        gdacs_url = getattr(settings, "GDACS_BASE_URL", "https://www.gdacs.org/xml/rss.xml")
        providers.append(
            ProviderMetadata(
                slug="gdacs",
                name="GDACS Alert System",
                needs_key=False,
                is_configured=bool(gdacs_url),
                attribution="Global Disaster Alert and Coordination System (UN-OCHA & European Commission).",
                license_url="https://www.gdacs.org/About/overview.aspx",
                rate_limit_policy="Public XML/RSS feed, polled at 30 min intervals",
                default_refresh_interval_minutes=30,
                status="ok" if bool(gdacs_url) else "disabled (no url)",
                notes="Global tropical cyclone and tsunami alert feeds.",
            )
        )

        # 8. INCOIS Marine Bulletins
        providers.append(
            ProviderMetadata(
                slug="incois",
                name="INCOIS Marine Bulletins",
                needs_key=False,
                is_configured=True,
                attribution="Ocean state forecasts and High Wave alerts from INCOIS, Ministry of Earth Sciences, Govt. of India.",
                license_url="https://incois.gov.in",
                rate_limit_policy="Public open bulletin ingestion",
                default_refresh_interval_minutes=60,
                status="ok",
                notes="Official Indian coastal authority bulletins override ORCA risk determinations.",
            )
        )

        # 9. LLM Reasoning Engine
        llm_provider = getattr(settings, "LLM_PROVIDER", "template")
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if llm_provider == "gemini":
            llm_configured = bool(gemini_key)
            llm_status = "ok" if llm_configured else "disabled (no key)"
        elif llm_provider == "anthropic":
            llm_configured = bool(anthropic_key)
            llm_status = "ok" if llm_configured else "disabled (no key)"
        else:  # template mode
            llm_configured = True
            llm_status = "ok"

        providers.append(
            ProviderMetadata(
                slug="llm",
                name=f"LLM Reasoning ({llm_provider.capitalize()} Mode)",
                needs_key=(llm_provider != "template"),
                is_configured=llm_configured,
                attribution="ORCA deterministic reasoning engine with verified plain-text explanation generator.",
                license_url="https://github.com/Abhilakkkkshya505/orca_project",
                rate_limit_policy=f"Daily token budget cap: {getattr(settings, 'LLM_DAILY_TOKEN_BUDGET', 200000):,} tokens",
                default_refresh_interval_minutes=0,
                status=llm_status,
                notes=f"Current provider: {llm_provider}. In template mode, no external LLM key is needed.",
            )
        )

        # 10. Map Basemap
        maptiler_key = os.environ.get("VITE_MAPTILER_KEY", "")
        map_style = os.environ.get("VITE_MAP_STYLE", "pmtiles")
        map_configured = bool(maptiler_key) if map_style == "maptiler" else True
        providers.append(
            ProviderMetadata(
                slug="map",
                name="Nautical Chart Basemap",
                needs_key=(map_style == "maptiler"),
                is_configured=map_configured,
                attribution="Map data © OpenStreetMap contributors, bathymetric contours from Natural Earth and GEBCO.",
                license_url="https://www.openstreetmap.org/copyright",
                rate_limit_policy="Cached vector tiles",
                default_refresh_interval_minutes=0,
                status="ok" if map_configured else "disabled (no key)",
                notes=f"Active style: {map_style}. Keyless OpenStreetMap and PMTiles available.",
            )
        )

        return providers

    @classmethod
    def get_by_slug(cls, slug: str) -> Optional[ProviderMetadata]:
        for p in cls.get_providers():
            if p.slug == slug:
                return p
        return None
