# TASK 2 of 6: Real data pipelines and the risk engine

Paste after the CONTEXT BLOCK. Do Tasks 0 and 1 first.

```
TASK 2: Build real ingestion for every enabled provider, and a risk engine that is correct, tested and honest.

---------------------------------------------------------------------
PART A: DATA CONTRACT (define first, then code to it)
---------------------------------------------------------------------
Write docs/DATA-CONTRACT.md and implement it as Pydantic models in backend/apps/geodata/contracts.py.

Canonical units (convert at the adapter boundary, never later):
  wave_height_m, wave_period_s, wave_direction_deg, swell_wave_height_m, swell_wave_period_s, wind_wave_height_m,
  wind_speed_kmh, wind_gust_kmh, wind_direction_deg, precipitation_mm_h, visibility_m, pressure_hpa,
  sst_c, chlorophyll_mg_m3, sea_level_m, current_speed_ms, current_direction_deg
All times UTC, timezone-aware. Missing values are `None`, never 0, -999 or NaN. Provider fill values are mapped to None at the adapter.
Each stored value carries: source slug, valid_time, issued_at, ingested_at, quality flags (`interpolated`, `model_only`, `cloud_gap`, `out_of_range`).
Sanity ranges (reject and log, store None): wave_height 0 to 30 m, wave_period 0 to 30 s, wind_speed 0 to 400 km/h, sst -2 to 40 C, chlorophyll 0.001 to 100 mg/m3, visibility 0 to 100000 m.

---------------------------------------------------------------------
PART B: ADAPTERS (interface: fetch, normalise, validate, store)
---------------------------------------------------------------------
Each adapter lives in apps/geodata/sources/<slug>.py, has recorded-response fixtures in tests/fixtures/, a `--dry-run`, retry with exponential backoff and jitter, a per-provider rate limiter, a timeout, structured logs, and updates DataSource.last_success_at / last_error. A failing provider must NOT break the others.

B1. open_meteo_marine. Confirm the host, endpoint, hourly variable names and units in the official docs before coding. Use the combined, wind-wave and swell variables for height, period and direction, plus sea surface temperature, ocean current and sea level variables if the API exposes them (confirm; skip any that do not exist, and say so in PROVIDERS.md). Multi-coordinate batching. Required attribution to the underlying wave model provider plus Open-Meteo (read the page and copy the exact wording).
B2. open_meteo_forecast. Wind speed and gusts at 10 m, precipitation, weather code, visibility, pressure, for 7 days hourly. Wind is requested in km/h explicitly. Same batching and attribution rules.
B3. noaa_erddap_sst and noaa_erddap_chlorophyll. Use NOAA CoastWatch ERDDAP griddap. DISCOVER dataset IDs by searching the ERDDAP catalog for a recent daily satellite chlorophyll product and a daily SST product that cover the Indian Ocean; verify variable names, units, time range and update lag; record the IDs, citations and licences in docs/PROVIDERS.md. Request a bbox subset for the last 14 days only, never global files. Compute and store: sst_c, sst_gradient_c_per_km (front strength using a documented kernel), chlorophyll_mg_m3, chlorophyll_gradient, cloud_gap flag (null where masked). Map ports and zones to cells. Cloud gaps stay None and are reported as gaps, never interpolated silently.
B4. copernicus_marine (feature flagged by credentials). Use the official `copernicusmarine` toolbox (verify the package name and current CLI/API). Discover a global analysis-forecast physics product for currents and SST and a biogeochemistry product for chlorophyll; record exact product and dataset IDs. Subset by bbox, variables and 7 days. If credentials are missing: disabled, with a clear reason in data-status.
B5. gdacs_events. Pull current global tropical cyclone and related hazard alerts from GDACS (verify the public feed or API, format, update frequency, terms). Convert each event affecting the sea area into an Advisory row with origin `gdacs`, severity mapped from GDACS alert level (green/orange/red -> info/warning/severe, document the mapping), geometry (point + buffer radius or polygon if provided), issued_at, expires_at, source_url. These are labelled "Third-party hazard alert (GDACS)", NOT an Indian official advisory.
B6. manual_advisories. Admin form and CSV import for official advisories (IMD, INCOIS, state fisheries, coast guard) with required fields: issuer, headline, body, severity, area (draw polygon on map or pick circle by port + radius), issued_at, expires_at, source_url, attachment optional. Every create or edit writes an AuditEntry. Expired advisories drop out automatically. IMPORTANT: INCOIS and IMD have no public machine-readable API that we could verify. Do not scrape them in this task. Build the manual path and an optional scraper interface that is disabled by default and documented as requiring the owner's written confirmation of permission.
B7. synthetic (dev only). A generator that makes plausible calm, moderate and storm scenarios for demo ports, clearly flagged synthetic=true, blocked when ENVIRONMENT=production (test this).
B8. Celery beat schedule per docs/backend.md. Stagger tasks. Add `check_data_freshness` that marks sources stale (age above 1.5x expected interval) or failing (above 3x, or 2 consecutive errors) and updates data-status.
B9. Pruning: ForecastSnapshot older than 14 days past valid_time, idempotent.

---------------------------------------------------------------------
PART C: THE RISK ENGINE
---------------------------------------------------------------------
Location: backend/apps/risk/rules.py (pure functions) and thresholds.py. No imports from Django inside rules.py.

C1. Inputs (dataclass): factors with value, unit, observed_at, source, data_age_minutes; advisories (severity, covers_point, active_in_window); vessel_class; window; now (passed in, never read inside).
C2. Factors and logic:
    - wave_height_m (max in window), wave_period_s (short steep waves are worse: apply a steepness factor wave_height / wave_period^2 and document the formula and limits), swell_height_m, wind_speed_kmh (max), wind_gust_kmh (max), precipitation_mm_h (max), visibility_m (min), and current_speed_ms (max, optional).
    - Each factor maps to safe / caution / unsafe via thresholds per vessel class (small_craft = non-mechanised or small outboard boats; mechanised = mechanised fishing vessels).
    - Overall level = the worst factor level.
    - Required factors for a rating: wave_height, wind_speed. If either is missing or stale, overall = unknown. Optional factors missing downgrade `confidence` and are listed in `missing`, but do not force unknown unless doing so would hide danger (document the rule).
    - Staleness limits per factor (documented, configurable): marine and wind forecasts older than 12 hours since issued_at are stale.
    - Advisory rule: warning or severe active in window and covering the point forces unsafe. A `watch` forces at least caution. An advisory feed that is stale or failing does NOT make the level safe: if the only reason the level is safe is the absence of advisory data, add an `advisory_unverified` flag to the result and cap confidence; show "Official advisories could not be checked" on the card.
    - Output RiskResult: level, confidence (high | medium | low), factors[] (key, label, value, unit, level, caution_at, unsafe_at, source, observed_at, data_age_minutes), missing[], flags[], reasons[] (stable machine codes like WAVE_HEIGHT_UNSAFE), rules_version, valid_from, valid_to.
C3. Thresholds. Do NOT keep arbitrary numbers silently. Search for published guidance you can cite: INCOIS Small Vessel Advisory Services criteria, IMD marine warning criteria, the Beaufort scale, Indian Coast Guard or Directorate General of Shipping or state fisheries department fishing-boat advisories, and Open-Meteo/WMO sea state (Douglas) scale. Put each threshold in docs/risk-thresholds-sources.md with its source URL and quote-free paraphrase. Where no citable source exists keep a conservative placeholder and mark it `PLACEHOLDER` in code and docs. Every threshold file starts with a banner: "DEVELOPMENT VALUES. Not reviewed by a marine-safety expert. Official warnings override." Add RULES_VERSION and a generated checksum test so any change is deliberate.
C4. Service layer (apps/risk/services.py): gathers snapshots for the port's cell(s) and window, calls the pure function, writes an immutable RiskAssessment (factors, data ages, rules version, flags), caches result with a key that includes lat, lon (rounded to 3 dp), window, vessel class and rules version. Invalidate on ingestion of that cell.
C5. Kill switch: RISK_OUTPUT_ENABLED=false returns 503 risk_output_paused and the UI shows the paused banner.

---------------------------------------------------------------------
PART D: TESTS (this is where quality is proven)
---------------------------------------------------------------------
D1. Table-driven boundary tests: for each factor and vessel class test values at caution-0.001, caution, between, unsafe-0.001, unsafe, unsafe+x. Assert exact levels.
D2. Property-based tests (hypothesis, verify package): increasing any hazard value never lowers the overall level (monotonicity); removing a required factor never produces `safe`; overall level equals the max of factor levels; the function is deterministic and does not read the clock.
D3. Missing/stale: each combination of missing required and optional factors, stale by 1 minute over the limit, exactly at the limit.
D4. Advisory: none, watch, warning, severe, expired, not covering, covering but starting after window, unverified feed.
D5. Scenario tests with real-shaped fixtures for a calm day, a monsoon swell day, a cyclone approach, a squall (high gust, short period), a data outage. Assert level, reasons and confidence.
D6. Adapter tests: recorded responses normalise to canonical units, fill values become None, out-of-range rejected, duplicates idempotent, provider outage keeps old data and flips status.
D7. Risk engine coverage must be 100 percent branch coverage. Print the coverage report.
D8. Integration: ingest real Open-Meteo data for 10 Indian ports, compute risk for each, print a table port | level | confidence | max wave | max wind | data age. Values must differ across ports.

---------------------------------------------------------------------
VERIFICATION
---------------------------------------------------------------------
scripts\verify-task2.ps1 printing PASS or FAIL for:
- all adapters import and pass fixture tests
- real ingestion ran for at least Open-Meteo marine and forecast, with row counts and the newest valid_time
- ERDDAP SST and chlorophyll real fetch (or documented failure reason)
- Copernicus and GFW show disabled (no key) or OK
- data-status shows correct statuses
- risk engine tests pass with 100 percent branch coverage
- property tests pass
- the 10-port table is printed with differing values
- synthetic data blocked in production mode
- thresholds file has the banner and sources doc exists
Run it and paste the complete output.
```
