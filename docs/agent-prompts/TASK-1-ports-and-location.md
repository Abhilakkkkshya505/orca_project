# TASK 1 of 6: Every port in the world, correct locations, no Kochi default

Paste after the CONTEXT BLOCK. Do Task 0 first.

```
TASK 1: Make location correct for every port. Remove every Kochi assumption.

---------------------------------------------------------------------
PART A: AUDIT THE LOCATION BUGS
---------------------------------------------------------------------
A1. Search the whole repo (backend, frontend, fixtures, seeds, docs, tests, env, Docker files) for: "Kochi", "Cochin", "Ernakulam", "9.93", "9.97", "76.2", "76.24", "COVERAGE_BBOX", default lat/lon constants, `?? 9.`, "defaultCenter", "initialViewState". Record every hit in docs/AUDIT.md with file and line, then remove or replace it.
A2. Trace one request end to end for Mumbai (18.93, 72.84): browser -> API -> service -> database -> response. Show where Kochi sneaks in (a default in the serializer, a cached key without coordinates, a seed that only has Kochi data, a frontend constant). Fix every cause. Add a regression test for each cause.
A3. Check the cache keys: they must include rounded lat, lon, window, vessel class and rules version. A key without location is a bug.

---------------------------------------------------------------------
PART B: THE PORT DATABASE
---------------------------------------------------------------------
B1. Model `Port` (app: geodata or a new `ports` app, your choice, record it):
    public_id UUID, name, name_ascii (unaccented, lowercase, for search), alt_names (JSON list), slug (unique, human readable, e.g. "mumbai-in", "port-blair-in"), country_code (ISO 3166-1 alpha-2), country_name, admin1_name (state or province), admin1_code, port_type (commercial | fishing_harbour | minor | anchorage | river | other), harbour_size (nullable), unlocode (nullable), location (PostGIS Point SRID 4326, lon -180..180, lat -90..90), marine_location (Point, nullable: the nearest point where marine model data exists), marine_offset_km (float, nullable), is_coastal (bool), is_active (bool), source, source_ref, created_at, updated_at.
    Indexes: GiST on location and marine_location, unique on slug, btree on country_code, GIN trigram on name_ascii (enable pg_trgm in a migration), btree on (country_code, admin1_code).
B2. Seed from a REAL dataset, in this order of preference. Verify the download location and the licence yourself and record both in docs/data-licences.md:
    1. NGA World Port Index (Publication 150), a US government dataset covering about 3,800 ports worldwide.
    2. If it cannot be downloaded from this machine, accept a local file path (`manage.py load_ports --file "<path>"`), tell the owner exactly what to download, and meanwhile use Natural Earth ports or OpenStreetMap harbour data (confirm licence and attribution).
    3. For India specifically, ALSO build a supplementary fishing-harbour file `data/ports/india_fishing_harbours.csv` with columns name, state, lat, lon, source_url, verified. Populate it only from sources you can cite (for example Ministry of Fisheries or state fisheries department lists, or OpenStreetMap harbour/fishing tags). Do not guess coordinates. Mark each row verified true/false. Rows you cannot cite stay out.
B3. Normalisation rules: strip and collapse whitespace; title-case names; unaccent for `name_ascii`; split alternate spellings into alt_names (Cochin/Kochi, Bombay/Mumbai, Madras/Chennai, Calcutta/Kolkata, Vizag/Visakhapatnam, Tuticorin/Thoothukudi, Mangalore/Mangaluru, Trivandrum/Thiruvananthapuram, Pondicherry/Puducherry, Panjim/Panaji); dedupe ports closer than 1 km with the same normalised name; resolve slug collisions by appending country code then admin1 then a counter; reject coordinates that are 0,0, out of range, or swapped.
B4. State mapping: use Natural Earth Admin-1 polygons (public domain, verify) for point-in-polygon to fill `admin1_name` for every port, because the port index has no state field. Print a per-state count for every Indian coastal state and union territory: Gujarat, Maharashtra, Goa, Karnataka, Kerala, Tamil Nadu, Puducherry, Andhra Pradesh, Odisha, West Bengal, Andaman and Nicobar Islands, Lakshadweep, Daman and Diu, Dadra and Nagar Haveli. Flag any with fewer than 3 ports in docs/AUDIT.md.
B5. Management commands (all idempotent, log with structlog, exit non-zero on failure): `load_ports [--file PATH] [--source nga|naturalearth|osm]`, `load_india_fishing_harbours`, `assign_admin1`, `snap_marine_points`, `add_port --name --lat --lon --country --type`.
B6. Admin: Port list with search, filters (country, state, type, active, coastal), a map widget if cheap to add, and an "Add fishing harbour" form that validates coordinates and writes an AuditEntry.

---------------------------------------------------------------------
PART C: SNAP EVERY PORT TO A VALID SEA POINT
---------------------------------------------------------------------
Marine models return no data on land cells, and a port's coordinate is often on the quay.
C1. `snap_marine_points`: for each port, probe the Open-Meteo marine endpoint at the port coordinate. If wave_height is null, probe a ring of points around the port at 0.05, 0.1, 0.2 and 0.3 degrees in 8 directions and pick the NEAREST point that returns data. Store `marine_location` and `marine_offset_km`. If no point within 0.3 degrees returns data, set is_coastal=false and marine_location=null (river or inland ports). Batch requests (Open-Meteo accepts multiple coordinates per call; confirm the limit in the docs), respect rate limits with backoff, and make the command resumable (skip ports already snapped, `--force` to redo).
C2. Risk and chat must use `marine_location` for sea data and `location` for display. The API response shows both and says "Sea conditions measured X km from the port" when the offset is above 5 km.
C3. A port with no marine point gets a clear `inland_or_unsupported` response with a nearest-coastal-port suggestion, never an error page and never a made-up value.

---------------------------------------------------------------------
PART D: ENDPOINTS
---------------------------------------------------------------------
D1. GET /api/v1/ports/  params: q (matches name, name_ascii and alt_names, accent-insensitive, typo-tolerant using pg_trgm similarity with a threshold you tune and document), country, state, type, coastal=true|false, near=lat,lon (distance ordered, distance_km in response), ordering, page, page_size (max 100). Response items: id, slug, name, country_code, country_name, admin1_name, port_type, lat, lon, is_coastal, current_level (nullable), current_level_valid_to (nullable).
D2. GET /api/v1/ports/{slug}/  full port with marine_location, offset, nearby ports (5), data freshness.
D3. GET /api/v1/ports/nearest/?lat=&lon=&limit=5&max_km=200  returns ports with distance_km and bearing.
D4. GET /api/v1/ports/coverage/  counts by country and, for India, by state, for the landing page and docs.
D5. GET /api/v1/geocode/?q=  Open-Meteo geocoding, cached in Redis 24 h, rate limited, returns places that are not ports (islands, towns, bays). Confirm the endpoint and parameters in its docs.
D6. GET /api/v1/risk/?port=<slug>  and  ?lat=&lon=  both work. Update docs/api.md and the OpenAPI schema. Regenerate frontend types.
D7. Coverage rule: ANY point on Earth is accepted if marine data exists within 0.3 degrees; otherwise return code `out_of_coverage` (open ocean beyond model grid is not expected) or `inland_point` with a nearest-port suggestion. Remove the narrow COVERAGE_BBOX.

---------------------------------------------------------------------
PART E: PORT INGESTION
---------------------------------------------------------------------
E1. Task `ingest_ports_weather_marine`: for all active coastal ports, fetch hourly marine and weather variables for the next 7 days at the port's marine_location (and wind at location). Schedule: India every 3 hours, rest of world every 6 hours, staggered so you never exceed provider limits. Command flags: `--country IN`, `--limit N`, `--slug mumbai-in`, `--dry-run`.
E2. Many ports share a grid cell. Deduplicate by snapping to the provider's grid resolution (document it) so you do not fetch the same cell 50 times, but keep a port -> cell mapping so each port reads its own cell.
E3. On-demand path for arbitrary map clicks or geocoded places that are not near an ingested cell: a cached fetch service with 30 minute cache, 5 second timeout, per-IP rate limit, and a visible `source_mode: "on_demand"` field in the response. This is a documented exception to "no external calls during a request". Record it in docs/ASSUMPTIONS.md and docs/architecture.md.
E4. Real run: execute `ingest_ports_weather_marine --country IN --limit 25` for real and show 10 stored rows from 5 different ports with different values.

---------------------------------------------------------------------
PART F: TESTS
---------------------------------------------------------------------
F1. test_port_loader: normalisation, aliases, dedupe, slug collisions, bad coordinates, antimeridian (Fiji, Kiribati, Chukotka-area ports), idempotent reload.
F2. test_port_search: "mumbay", "kochii", "cochin", "bombay", "vizag", "thoothukudi", "port blair", "st johns" (two countries), accents (Lübeck, São Paulo), empty query, 1-character query, 200-character query, SQL special characters.
F3. test_nearest_ports: Chennai coordinates returns Chennai-area ports first; a mid-ocean point returns a valid far result with distance; poles and antimeridian handled.
F4. test_risk_ports: for 13 ports (Kochi, Mumbai, Chennai, Visakhapatnam, Kolkata, Kandla, Mangalore, Tuticorin, Paradip, Port Blair, Colombo, Singapore, Rotterdam) assert location differs per response and values are not identical across ports, using recorded fixtures in CI and one `@pytest.mark.live` test against the real API.
F5. test_inland: a river port or inland coordinate returns inland_point with suggestion, never `safe`.
F6. test_no_hardcoded_location: scans source and templates and fails if a default coordinate or "Kochi" default exists outside tests/fixtures/docs.
F7. test_cache_keys: two nearby ports never share a cache entry.

---------------------------------------------------------------------
VERIFICATION
---------------------------------------------------------------------
Create scripts\verify-task1.ps1 printing PASS or FAIL for:
- Port count worldwide (print the number; expect above 3000 if NGA loaded) and per-Indian-state counts with flags
- /ports/?q=mumbai returns Mumbai; ?q=cochin returns Kochi; ?q=vizag returns Visakhapatnam
- /ports/nearest/ for Chennai coordinates puts Chennai first
- marine snap stats: how many ports snapped, how many offset above 5 km, how many inland
- /risk/?port=<slug> for 8 different ports returns 8 different locations and different values
- inland point returns inland_point with a suggestion
- no hardcoded Kochi default in repo
- cache keys include location
- full backend test suite passes
Run it. Paste complete output. Fix and rerun until PASS.
```
