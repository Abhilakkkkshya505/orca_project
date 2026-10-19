# ORCA Oceanographic & Meteorological Data Contract

Version: **1.0.0**  
Status: **Canonical Specification**  
Module: [`backend/apps/geodata/contracts.py`](file:///backend/apps/geodata/contracts.py)

---

## 1. Scope & Principles

This specification defines the strict data contracts, canonical units, validation rules, and quality provenance for all oceanographic, meteorological, and satellite telemetry ingested into ORCA.

### Core Rules
1. **Adapter Boundary Normalization**: All unit conversion and coordinate alignment occurs strictly at the adapter boundary. The internal database, caching layer, rules engine, and ML pipelines consume only canonical units.
2. **Strict Missing Value Representation**: Missing or unavailable telemetry is represented as `None` (JSON `null`). Values such as `0`, `-999`, `-9999`, `NaN`, `Inf`, or empty strings are strictly forbidden as placeholders and must be mapped to `None` at the adapter.
3. **UTC Timezone Awareness**: All timestamps (`valid_time`, `issued_at`, `ingested_at`, `observed_at`) must be timezone-aware ISO 8601 UTC datetimes. Naive datetimes are rejected at the boundary.
4. **Provenance & Auditability**: Every observation and forecast point must carry:
   - `source_slug`: Identifier of the originating data provider (e.g., `open_meteo_marine`, `noaa_erddap_sst`).
   - `valid_time`: Timestamp for which the measurement or forecast applies.
   - `issued_at`: Timestamp when the model run or satellite pass was released by the provider.
   - `ingested_at`: UTC timestamp when ORCA processed the record.
   - `quality_flags`: Explicit list of data quality labels (`interpolated`, `model_only`, `cloud_gap`, `out_of_range`).
5. **Physical Sanity Bounds**: Telemetry outside realistic geophysical bounds is rejected at the adapter boundary, logged with structured warnings, and stored as `None` with the `out_of_range` flag.

---

## 2. Canonical Physical Units

| Variable Name | Canonical Unit | Representation | Description |
|---|---|---|---|
| `wave_height_m` | Meters ($m$) | `float | None` | Significant wave height ($H_{m0}$) combined sea & swell |
| `wave_period_s` | Seconds ($s$) | `float | None` | Peak or mean wave period ($T_p$ or $T_z$) |
| `wave_direction_deg` | Degrees ($^\circ$) | `float | None` | Direction waves are coming from ($0^\circ = \text{North}, 90^\circ = \text{East}$) |
| `swell_wave_height_m` | Meters ($m$) | `float | None` | Significant swell wave height |
| `swell_wave_period_s` | Seconds ($s$) | `float | None` | Dominant swell wave period |
| `wind_wave_height_m` | Meters ($m$) | `float | None` | Wind-sea wave height |
| `wind_speed_kmh` | Kilometers per hour ($km/h$) | `float | None` | 10-meter sustained wind speed |
| `wind_gust_kmh` | Kilometers per hour ($km/h$) | `float | None` | 10-meter peak wind gust |
| `wind_direction_deg` | Degrees ($^\circ$) | `float | None` | Direction wind is blowing from ($0^\circ = \text{North}$) |
| `precipitation_mm_h` | Millimeters per hour ($mm/h$) | `float | None` | Total hourly liquid water precipitation equivalent |
| `visibility_m` | Meters ($m$) | `float | None` | Horizontal meteorological optical range |
| `pressure_hpa` | Hectopascals ($hPa$) | `float | None` | Mean sea level atmospheric pressure ($1\text{ hPa} = 1\text{ mbar}$) |
| `sst_c` | Degrees Celsius ($^\circ C$) | `float | None` | Sea surface temperature (sub-skin or foundation) |
| `chlorophyll_mg_m3` | Milligrams per $m^3$ ($mg/m^3$) | `float | None` | Chlorophyll-a concentration in near-surface waters |
| `sea_level_m` | Meters ($m$) | `float | None` | Sea surface height relative to geoid or mean sea level |
| `current_speed_ms` | Meters per second ($m/s$) | `float | None` | Ocean surface current speed |
| `current_direction_deg` | Degrees ($^\circ$) | `float | None` | Ocean surface current flow direction (towards) |

---

## 3. Geophysical Sanity Bounds & Validation Rules

Values falling outside these bounds indicate sensor failure, model divergence, corrupted GRIB files, or erroneous coordinates. Such values must be rejected, logged with source context, and replaced with `None` carrying the `out_of_range` quality flag.

| Parameter | Minimum | Maximum | Reject Action |
|---|---|---|---|
| `wave_height_m` | `0.0 m` | `30.0 m` | Reject, log, store `None`, set `out_of_range` |
| `wave_period_s` | `0.0 s` | `30.0 s` | Reject, log, store `None`, set `out_of_range` |
| `wind_speed_kmh` | `0.0 km/h` | `400.0 km/h` | Reject, log, store `None`, set `out_of_range` |
| `wind_gust_kmh` | `0.0 km/h` | `500.0 km/h` | Reject, log, store `None`, set `out_of_range` |
| `sst_c` | `-2.0 °C` | `40.0 °C` | Reject, log, store `None`, set `out_of_range` |
| `chlorophyll_mg_m3` | `0.001 mg/m³` | `100.0 mg/m³` | Reject, log, store `None`, set `out_of_range` |
| `visibility_m` | `0.0 m` | `100,000.0 m` | Reject, log, store `None`, set `out_of_range` |
| `precipitation_mm_h` | `0.0 mm/h` | `500.0 mm/h` | Reject, log, store `None`, set `out_of_range` |
| `pressure_hpa` | `850.0 hPa` | `1085.0 hPa` | Reject, log, store `None`, set `out_of_range` |
| `current_speed_ms` | `0.0 m/s` | `10.0 m/s` | Reject, log, store `None`, set `out_of_range` |

---

## 4. Quality Flags

- `interpolated`: The value was spatially or temporally interpolated between adjacent grid cells or time steps.
- `model_only`: Numerical simulation value without direct in-situ buoy or radiometer assimilation.
- `cloud_gap`: Satellite optical sensor was obscured by clouds; observation is null and reported as a gap, never silently imputed.
- `out_of_range`: Provider returned a value violating geophysical sanity bounds.

---

## 5. Implementation Reference

The canonical contracts are implemented using Pydantic v2 in:
[`backend/apps/geodata/contracts.py`](file:///backend/apps/geodata/contracts.py)
