# Location Audit & Kochi Elimination Report

This audit tracks all locations in the repository where hardcoded Kochi assumptions, default coordinates, or narrow bounding boxes were discovered, traces the end-to-end Mumbai request, and records the per-state port distribution.

---

## 1. Audit Findings (A1)

| # | File | Line(s) | Hit / Assumption | Root Cause & Resolution |
|---|---|---|---|---|
| 1 | `backend/apps/agents/llm.py` | 87–93 | `location_name="Kochi"`, `lat=9.97`, `lon=76.24` | Default fallback when place extraction had no location or coordinates. **Resolution**: Removed hardcoded Kochi. If no location can be extracted and no default provided, return `location_name=None`, `lat=None`, `lon=None` or prompt clarification. |
| 2 | `frontend/src/routes/explore.tsx` | 10 | `useState({ lat: 9.97, lon: 76.24 })` | Map initialized unconditionally to Kochi coordinates. **Resolution**: Initialize from URL search parameters (`?port=` or `?lat=&lon=`), user's geolocation or saved default port, defaulting to an overview without assuming Kochi. |
| 3 | `frontend/src/features/map/MapView.tsx` | 16 | `selectedLocation = { lat: 9.97, lon: 76.24 }` | Fallback prop defaulted to Fort Kochi. **Resolution**: Changed fallback to null/undefined or dynamic center based on loaded viewport/ports. |
| 4 | `frontend/src/routes/locations.tsx` | 40, 111, 133, 141 | `defaultValues: { lat: 9.97, lon: 76.24 }`, placeholders | Form prefilled with Kochi coordinates and placeholder "Fort Kochi Outer Anchorage". **Resolution**: Changed defaults to empty coordinates with generic coastal placeholders (e.g., "e.g. Sassoon Dock, Mumbai"). |
| 5 | `frontend/src/features/chat/ChatPanel.tsx` | 80 | "Ask about conditions off Kochi..." | Hardcoded prompt suggestion text. **Resolution**: Dynamically generate suggested prompts from user's current port, nearby ports, or popular active ports. |
| 6 | `frontend/src/routes/landing.tsx` | 71–72 | `SAMPLE STATION • KOCHI, KERALA`, `Fort Kochi Anchorage (9.97°N, 76.24°E)` | Hardcoded station hero card. **Resolution**: Dynamically show featured live coastal stations (e.g. Mumbai, Chennai, Kochi, Visakhapatnam) or real port data. |
| 7 | `frontend/src/routes/signup.tsx` | 83 | `placeholder="Kochi Trawler 4"` | Hardcoded placeholder. **Resolution**: Changed to neutral vessel placeholder (e.g. `"e.g. Sagar Kanya 1"`). |
| 8 | `backend/apps/risk/services.py` | 19–21, 42–43 | `COVERAGE_BBOX = [68.0, 6.0, 89.0, 24.0]` | Hardcoded bounding box blocking all non-Indian ports (Rotterdam, Singapore, Colombo, etc.) with `OutOfCoverage`. **Resolution**: Removed narrow `COVERAGE_BBOX`. Any point on Earth is supported if marine data is available within 0.3°; otherwise returns `inland_point` or `out_of_coverage`. |
| 9 | `backend/apps/risk/views.py` | 34–36 | `if not lat_str or not lon_str: missing_coordinates` | API rejected `?port=<slug>` requests without raw coordinates. **Resolution**: Added support for `?port=<slug>` to resolve port coordinates and snapped marine location directly. |

---

## 2. End-to-End Request Trace for Mumbai (A2)

**Test Coordinates**: Mumbai Harbour / Sassoon Dock (`18.93°N, 72.84°E`).

1. **Browser Request**: User navigates to `/explore?port=mumbai-in` or clicks Mumbai on the nautical chart.
   - *Previous failure*: `explore.tsx` ignored the query param and immediately reset `selectedLocation` to `lat: 9.97, lon: 76.24` (Kochi).
   - *Fix*: `explore.tsx` reads `searchParams` (`port` or `lat`/`lon`), queries `/api/v1/ports/mumbai-in/`, and focuses the map and risk view on Mumbai.
2. **API Layer (`/api/v1/risk/`)**:
   - *Previous failure*: The view required `lat` & `lon` query params; passing `port=mumbai-in` caused an HTTP 400 `missing_coordinates`. If coordinates `18.93, 72.84` were passed, they were bounded by `COVERAGE_BBOX` and if marine data at the quay point was null, it had no snapping fallback.
   - *Fix*: The view accepts either `?port=mumbai-in` or `?lat=18.93&lon=72.84`. When `port` is provided, the API loads the `Port` record, using `marine_location` (`18.90°N, 72.80°E`, offset 4.2 km) for marine grid telemetry and `location` for display.
3. **Service Layer (`evaluate_and_record_risk`)**:
   - *Previous failure*: If snapshots were not yet seeded for Mumbai, the service evaluated risk on empty data or failed.
   - *Fix*: Added on-demand cached fetcher (Part E3) with 30-min Redis cache and 5s timeout. Open-Meteo marine & weather telemetry is retrieved at the snapped marine location and recorded into snapshots.
4. **Cache Key Construction**:
   - *Previous bug*: Any cache key lacking latitude and longitude returned the same result regardless of location.
   - *Fix*: All risk cache keys explicitly incorporate `lat:round(2)`, `lon:round(2)`, `vessel_class`, `window_hours`, and `rules_version`:
     `orca:risk:{round(lat,2)}:{round(lon,2)}:{vessel_class}:{valid_from.isoformat()}:{rules_version}`
5. **Response**:
   - The response contains both `location` (`lat: 18.93, lon: 72.84`) and `marine_location` (`lat: 18.90, lon: 72.80`), with `marine_offset_km: 4.2`, and Mumbai-specific factor values (wave height, period, wind speed).

---

## 3. Indian Coastal States & UTs Port Coverage (B4)

Initial audit of NGA World Port Index and supplementary fishing harbours across all 14 coastal states and UTs:

| State / Union Territory | Minimum Target | Supplemented Count | Status | Notes |
|---|---|---|---|---|
| Gujarat | ≥ 3 | 25+ | PASS | Major ports (Kandla, Mundra, Pipavav) + 8 fishing harbours |
| Maharashtra | ≥ 3 | 18+ | PASS | Mumbai, JNPT, Sassoon Dock, New Ferry Wharf, Ratnagiri, etc. |
| Goa | ≥ 3 | 5+ | PASS | Mormugao, Panaji, Betul, Malim, Cutbona |
| Karnataka | ≥ 3 | 12+ | PASS | New Mangalore, Malpe, Karwar, Honnavar, Gangolli, Tadri |
| Kerala | ≥ 3 | 15+ | PASS | Cochin, Vizhinjam, Neendakara, Munambam, Beypore, etc. |
| Tamil Nadu | ≥ 3 | 20+ | PASS | Chennai, Ennore, Thoothukudi, Kasimedu, Nagapattinam |
| Puducherry | ≥ 3 | 3 | PASS | Puducherry, Karaikal, Mahe |
| Andhra Pradesh | ≥ 3 | 12+ | PASS | Visakhapatnam, Kakinada, Krishnapatnam, Nizampatnam, Bhavanapadu |
| Odisha | ≥ 3 | 8+ | PASS | Paradip, Dhamra, Gopalpur, Chandipur, Astaranga |
| West Bengal | ≥ 3 | 8+ | PASS | Kolkata, Haldia, Petuaghat, Shankarpur, Fraserganj |
| Andaman and Nicobar Islands | ≥ 3 | 6+ | PASS | Port Blair, Junglighat, Campbell Bay, Diglipur, Hut Bay |
| Lakshadweep | ≥ 3 | 4 | PASS | Kavaratti, Agatti, Andrott, Minicoy |
| Dadra and Nagar Haveli and Daman and Diu | ≥ 3 | 4 | PASS | Daman (Moti/Nani), Diu (Vanakbara, Ghoghla) |

**Flagged States (< 3 ports initially in raw NGA)**:
- In the raw NGA dataset, small union territories (Daman & Diu, Lakshadweep, Puducherry) and smaller fishing ports had fewer than 3 commercial ports listed.
- **Resolution**: Successfully addressed by integrating `data/ports/india_fishing_harbours.csv` ensuring every coastal state and UT has at least 3 to 25+ verified ports.
