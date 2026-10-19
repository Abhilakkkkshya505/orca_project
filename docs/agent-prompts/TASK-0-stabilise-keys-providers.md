# TASK 0 of 6: Stabilise the stack, wire the API keys, prove every provider works

Paste after the CONTEXT BLOCK.

```
TASK 0: Make the project boot cleanly from a clean clone, wire the owner's API keys safely, and prove which data providers are live.

The owner reports the backend "does not work at all". Before building anything new, find out why and fix it.

---------------------------------------------------------------------
PART A: BOOT AND TRIAGE
---------------------------------------------------------------------
A1. From a clean state run: docker compose -f infra\docker-compose.yml down -v, then up -d --build. Capture every error from every service (api, worker, beat, db, redis, frontend). Write them verbatim into docs/AUDIT.md under "Boot errors".
A2. Fix root causes, not symptoms. Typical causes to check: GDAL/GEOS/PROJ libraries missing in the image, wrong ENGINE for PostGIS, migrations out of order or referencing missing apps, CELERY_BROKER_URL pointing at the wrong host, uvicorn started with the wrong module path, ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS not including app.localtest.me / api.localtest.me, CORS missing credentials, cookie domain wrong for localtest.me, Windows line endings (CRLF) breaking shell scripts inside Linux containers, volume mounts of Windows paths with spaces, healthchecks failing, frontend proxy to the wrong API URL.
A3. Make these succeed and show the output of each:
    - docker compose ps  (all services healthy)
    - GET http://api.localtest.me:8000/api/v1/health/live/   (200)
    - GET http://api.localtest.me:8000/api/v1/health/ready/  (200, db ok, redis ok)
    - python manage.py migrate --check
    - python manage.py check
    - python manage.py spectacular --file schema.yml --validate
    - a Celery worker task round-trip (enqueue a trivial ping task, see it succeed in the worker log)
    - celery beat shows its schedule loading
    - the frontend dev server loads at http://app.localtest.me:5173 and can call the API without CORS or cookie errors (prove with a signup then /auth/me/ in the browser, session cookie present on .localtest.me).
A4. Add `scripts\dev-up.ps1`, `scripts\dev-down.ps1`, `scripts\dev-reset.ps1` (wipes volumes, migrates, creates a dev superuser from env, seeds demo data). They must work from a PowerShell prompt opened at the project root, with paths containing spaces.
A5. Add `.gitattributes` forcing LF for *.sh, *.py, *.ts, *.tsx, *.yml, Dockerfile. Re-normalise.

---------------------------------------------------------------------
PART B: KEYS AND CONFIGURATION
---------------------------------------------------------------------
The owner will place keys in backend\.env and frontend\.env. Create complete `.env.example` files (fake values, one comment line per variable saying what it is for, where to get it, and whether it is required, recommended or optional). Include AT LEAST these variables:

REQUIRED TO RUN LOCALLY (no key needed, but the variables exist)
  ENVIRONMENT=local
  SECRET_KEY, DATABASE_URL, REDIS_URL, CELERY_BROKER_URL, COOKIE_DOMAIN=.localtest.me
  ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, CORS_ALLOWED_ORIGINS, FRONTEND_URL
  RISK_OUTPUT_ENABLED=true
  DEV_BYPASS_ACCESS=true          (only honoured when ENVIRONMENT=local; app refuses to start if true in production)
  TURNSTILE_SECRET_KEY / VITE_TURNSTILE_SITE_KEY   (use Cloudflare's documented test keys; look them up in Cloudflare's Turnstile testing docs and put them in the example file as comments with the source URL)
  EMAIL_BACKEND=console           (dev mail goes to the console or a dev mail sink container)

DATA PROVIDERS
  OPEN_METEO_API_KEY=             (optional; free non-commercial use needs no key)
  COPERNICUSMARINE_USERNAME= / COPERNICUSMARINE_PASSWORD=     (recommended; free account at the Copernicus Marine Service)
  GFW_API_ACCESS_TOKEN=           (recommended; Global Fishing Watch API v3 token, free for non-commercial use, needed for ML training and for fishing-activity overlays)
  CDS_API_KEY= / CDS_API_URL=     (optional; ECMWF Climate Data Store key for ERA5 reanalysis, used only for the optional forecast-error model)
  NOAA_ERDDAP_BASE_URL=https://coastwatch.pfeg.noaa.gov/erddap    (no key; verify the URL and that it responds)
  GDACS_BASE_URL=                 (no key; verify the current public endpoint for global disaster and cyclone alerts)

LLM PROVIDERS
  LLM_PROVIDER=template           (template | gemini | anthropic)
  GEMINI_API_KEY=  GEMINI_MODEL=  (model name from env, never hardcoded; verify the current SDK package and model names in Google's docs)
  ANTHROPIC_API_KEY=  ANTHROPIC_MODEL=  (same rule)
  LLM_DAILY_TOKEN_BUDGET=200000

MAP
  VITE_MAP_STYLE=pmtiles|maptiler
  VITE_MAPTILER_KEY=              (optional easy path; free tier key)
  VITE_PMTILES_URL=               (optional self-hosted basemap, needs no key)

OBSERVABILITY (optional)
  SENTRY_DSN= / VITE_SENTRY_DSN=

B2. Settings must read these through django-environ with clear startup errors listing every missing REQUIRED variable at once (not one at a time).
B3. Add a provider registry in backend/apps/geodata/providers.py: for each provider, a slug, human name, whether it needs a key, how to detect it is configured, its attribution text, its licence URL, its rate-limit policy and its default refresh interval. A provider with a missing key is `disabled (no key)`, never a crash.

---------------------------------------------------------------------
PART C: PROVIDER HEALTH CHECK
---------------------------------------------------------------------
C1. Build `python manage.py check_providers` and `scripts\check-keys.ps1`. For each provider make ONE small real call and print a table: provider | configured | live call result | latency ms | sample value | notes. Rules:
    - Never print secrets. Print "set" or "missing".
    - Open-Meteo marine: request wave_height and wave_period for 3 places (Kochi 9.93,76.27 offshore snap; Mumbai 18.9,72.8; Chennai 13.08,80.3) and print the first value. Confirm the marine endpoint host and parameter names in Open-Meteo's docs first.
    - Open-Meteo forecast: wind_speed_10m and wind_gusts_10m for the same points.
    - Open-Meteo geocoding: search "Mangalore" and print the top result with country.
    - NOAA ERDDAP: list a chlorophyll dataset and an SST dataset you will use later; print their IDs and time coverage (discover them from the ERDDAP catalog search; do not guess IDs).
    - Copernicus Marine: log in with the toolbox and fetch metadata for one product; print product ID and variables. If credentials are missing print "disabled (no key)".
    - Global Fishing Watch: call a cheap authenticated endpoint with the Bearer token (read the v3 docs to pick one) and print the HTTP status. If missing, "disabled (no key)".
    - GDACS: fetch the current event list and print how many events.
    - LLM providers: for the configured provider, send a 1-sentence test prompt and print latency and token counts. For `template`, print "template mode OK".
    - Map: if VITE_MAPTILER_KEY set, fetch one style JSON; if PMTiles URL set, issue a HEAD with a Range request.
C2. Add an admin page "Data sources" showing the same table, last success, last error, next scheduled run, enabled toggle (audit logged).
C3. Add `GET /api/v1/data-status/` (public) returning for each enabled provider: slug, name, status ok|stale|failing|disabled, last_success_at, age_minutes, attribution. No secrets.
C4. Write docs/PROVIDERS.md with the final table of providers, what each is used for, its terms (non-commercial?), attribution text, rate limits, and the fallback when it is missing.
C5. Add an Attribution component and footer section showing required credits for every ENABLED data source (Open-Meteo with the required DWD attribution, NOAA, Copernicus, Global Fishing Watch, Protomaps or MapTiler and OpenStreetMap contributors, NGA, Natural Earth). Confirm each provider's exact attribution wording from its own terms page.

---------------------------------------------------------------------
PART D: TESTS AND VERIFICATION
---------------------------------------------------------------------
D1. Tests: settings loader reports ALL missing required vars; app refuses DEV_BYPASS_ACCESS=true with ENVIRONMENT=production; provider registry marks providers disabled when keys missing; data-status never leaks secrets; health endpoints.
D2. Create scripts\verify-task0.ps1 printing PASS or FAIL for:
    - clean clone boots, all containers healthy
    - health live and ready
    - migrations check, manage.py check, schema validates
    - celery worker round-trip
    - frontend to API call works with session cookie across subdomains
    - check_providers runs and prints a table with no secret values
    - .env is git-ignored and absent from git history of this task (git log -p grep for key patterns)
    - tests pass
Run it. Paste the whole output in your report. Fix and rerun until all PASS.

OUTPUT: also append "Task 0" notes to CHANGELOG.md and PROGRESS.md.
```
