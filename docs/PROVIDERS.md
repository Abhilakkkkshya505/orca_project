# ORCA External Data Providers & Attribution Guide

This document catalogues all external oceanographic, meteorological, satellite, and spatial providers integrated into ORCA. It defines licensing terms, attribution texts, rate limits, and failure fallback behaviors.

---

## 1. Provider Directory

| Provider | Purpose in ORCA | Licensing / Terms | Rate Limit Policy | Required Attribution Text | Fallback Behavior |
|---|---|---|---|---|---|
| **Open-Meteo Marine** | Significant wave height, wave direction, wave period, swell waves. | Free for non-commercial use under CC-BY 4.0. Commercial key optional. | 10,000 daily requests open tier. Cached for 1 hour. | *"Marine weather data from Open-Meteo.com under CC-BY 4.0 with data from DWD and NOAA."* | Cached previous snapshot (up to 6 hours), then marks wave factor as stale/unknown. |
| **Open-Meteo Forecast** | Wind speed at 10m, wind gusts at 10m, surface pressure, precipitation. | Free for non-commercial use under CC-BY 4.0. | 10,000 daily requests open tier. Cached for 1 hour. | *"Atmospheric wind and weather forecasts from Open-Meteo.com (CC-BY 4.0)."* | Cached previous snapshot, then marks wind factor as stale/unknown. |
| **Open-Meteo Geocoding** | Coastal port and station search autocomplete. | Open access under CC-BY 4.0 with OSM data. | 10,000 daily requests. | *"Geocoding data from Open-Meteo under CC-BY 4.0 with OpenStreetMap contributors."* | Offline fallback to internal world ports database (`apps.ports`). |
| **NOAA CoastWatch ERDDAP** | Sea Surface Temperature (SST: `jplMURSST41`) and Chlorophyll-a (`erdMH1chla8day`). | Public domain U.S. government data. | Polite request intervals (no authentication required). | *"Satellite SST and Chlorophyll-a telemetry provided by NOAA CoastWatch / OceanWatch."* | Cached satellite raster or synthetic climatology with visible `synthetic: true` flag. |
| **Copernicus Marine Service** | High-resolution ocean surface currents, salinity, and biogeochemical gap-filled products. | Free registered account under Copernicus Marine Service License. | Standard quota per registered account. | *"E.U. Copernicus Marine Service Information."* | Marked as `disabled (no key)`. Model relies on Open-Meteo and INCOIS feeds. |
| **Global Fishing Watch (GFW)** | Commercial vessel AIS tracking, fishing effort heatmaps, and ML training ground truth. | Free API v3 token for academic, conservation, and non-commercial research. | 10 requests/sec, 10,000 monthly credits. | *"Global Fishing Watch API v3 used under non-commercial research licence."* | Marked as `disabled (no key)`. Advisory fishing zone heuristic model active. |
| **GDACS Global Alert System** | Global Disaster Alert and Coordination System for tropical cyclones and tsunamis. | Open public access (UN-OCHA and European Commission). | Polled every 30 minutes. | *"Global Disaster Alert and Coordination System (GDACS - UN-OCHA & European Commission)."* | Preserves active bulletins until expiration timestamp. |
| **INCOIS Marine Bulletins** | High wave alerts, swell surge warnings, and potential fishing zone (PFZ) advisories for India. | Government of India open data. | Periodic bulletin check. | *"Ocean state forecasts and High Wave alerts from INCOIS, Ministry of Earth Sciences, Govt. of India."* | Stored advisory snapshots. Official warnings strictly override ORCA risk. |
| **LLM Reasoning Engine** | Intent classification and plain-language risk explanation generation. | In-house deterministic template engine or external API (Gemini / Anthropic). | Daily token budget hard cap: 200,000 tokens. | *"ORCA deterministic reasoning engine with verified plain-text explanation generator."* | Template fallback mode operates deterministically with zero API keys. |
| **Nautical Chart Basemap** | MapLibre nautical chart layers and bathymetric contours. | OpenStreetMap (ODbL) and Natural Earth public domain. | Local caching / PMTiles vector tiles. | *"Map data © OpenStreetMap contributors, bathymetry from Natural Earth and GEBCO."* | Built-in offline raster and PMTiles vector tiles. |

---

## 2. Hard Safety Rules Regarding Data

1. **Rule S1:** Risk levels (`safe`, `caution`, `unsafe`, `unknown`) are calculated **exclusively** by the deterministic rules engine (`apps/risk/rules.py`). No provider data overrides this logic directly.
2. **Rule S2:** Missing or stale data from any provider always results in `unknown`, **never** defaulting to `safe`.
3. **Rule S6:** Any synthetic or simulated provider data is tagged with `synthetic: true` in the API and renders a prominent warning banner.
4. **Rule S8:** Official IMD and INCOIS warnings supersede ORCA recommendations at all times.
