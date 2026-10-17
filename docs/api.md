# API Reference

Base URL: `https://api.orca.example/api/v1/`. The generated OpenAPI schema at `/api/v1/schema/` is the source of truth. This file is the human summary and must be updated in the same PR as any endpoint change.

## Conventions

- JSON in and out. `Content-Type: application/json`.
- Auth: session cookie. Unsafe methods need `X-CSRFToken`.
- IDs in paths and bodies are `public_id` UUIDs.
- Timestamps: ISO 8601 in UTC with `Z`.
- Coordinates: `lat`, `lon` as decimal degrees (WGS84).
- Versioning: URL path (`/v1/`). Breaking changes go to `/v2/`. Additive changes (new optional fields) stay in `/v1/`.
- Pagination (lists): `?page=1&page_size=25` (max 100). Response `{count, next, previous, results}`.
- Error body for all non-2xx:

```json
{ "error": { "code": "validation_error", "message": "Check the highlighted fields.", "details": { "email": ["Enter a valid email address."] }, "request_id": "8f1c..." } }
```

Error codes: `validation_error`, `not_authenticated`, `permission_denied`, `not_found`, `rate_limited`, `turnstile_failed`, `turnstile_unavailable`, `invalid_credentials`, `email_not_verified`, `out_of_coverage`, `data_unavailable`, `llm_budget_exceeded`, `risk_output_paused`, `internal_error`.

`429` responses include `Retry-After` and `details.retry_after_seconds`.

## Access levels

- **Public**: no login. Listed explicitly because they use `AllowAny`.
- **Guest or user**: valid session, guest sessions allowed.
- **User**: verified, signed-in user.
- **Staff**: `is_staff`, and not exposed to the frontend.

## Health and status (Public)

| Method | Path | Response |
|---|---|---|
| GET | `/health/live/` | `200 {"status":"ok"}` (process is up) |
| GET | `/health/ready/` | `200 {"status":"ok","checks":{"db":"ok","redis":"ok"}}` or `503` with failing checks |
| GET | `/data-status/` | `200 {"sources":[{"slug":"open_meteo","name":"Open-Meteo","last_success_at":"...","age_minutes":42,"status":"ok|stale|failing"}]}` |
| GET | `/auth/csrf/` | `204`, sets `csrftoken` cookie |

## Auth (Public unless noted)

All requests with Turnstile include `turnstile_token` (string).

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/auth/signup/` | `{email, display_name, password, turnstile_token, claim_guest_threads?}` | `201 {"detail":"..."}` |
| POST | `/auth/verify-email/` | `{token}` | `200 {"detail":"Email verified."}` |
| POST | `/auth/resend-verification/` | `{email, turnstile_token}` | `200 {"detail":"..."}` |
| POST | `/auth/login/` | `{email, password, turnstile_token, claim_guest_threads?}` | `200 User` |
| POST | `/auth/logout/` | none | `204` (User) |
| GET | `/auth/me/` | none | `200 User` or `401` (User) |
| POST | `/auth/password-reset/` | `{email, turnstile_token}` | `200 {"detail":"..."}` |
| POST | `/auth/password-reset/confirm/` | `{uid, token, new_password}` | `200 {"detail":"..."}` |
| POST | `/auth/password-change/` | `{current_password, new_password}` | `200 {"detail":"..."}` (User) |

`User`:

```json
{ "id": "uuid", "email": "a@b.com", "display_name": "Arun", "is_email_verified": true,
  "preferred_units": "metric", "default_vessel_class": "small_craft", "created_at": "..." }
```

Validation: email valid and at most 254 chars; display name 1 to 80 chars; password minimum 10 chars plus Django validators.

## Profile (User)

| Method | Path | Body | Response |
|---|---|---|---|
| PATCH | `/me/` | any of `{display_name, preferred_units, default_vessel_class}` | `200 User` |
| DELETE | `/me/` | `{password}` | `204` |

## Risk (Guest or user)

`GET /risk/?lat=9.97&lon=76.24&from=2026-10-19T00:00:00Z&to=2026-10-19T12:00:00Z&vessel_class=small_craft`

| Param | Rules |
|---|---|
| `lat`, `lon` | required, inside coverage bbox else `out_of_coverage` |
| `from`, `to` | optional, default now to now+12h, max window 48 h, `to` after `from`, `from` not before now minus 1 h |
| `vessel_class` | `small_craft` or `mechanised`, default from profile or `small_craft` |

Response `200 RiskAssessment`:

```json
{
  "id": "uuid",
  "level": "caution",
  "location": { "lat": 9.97, "lon": 76.24 },
  "valid_from": "...", "valid_to": "...",
  "vessel_class": "small_craft",
  "factors": [
    { "key": "wave_height_m", "label": "Wave height", "value": 1.8, "unit": "m",
      "level": "caution", "caution_at": 1.5, "unsafe_at": 2.5,
      "source": "open_meteo", "observed_at": "...", "data_age_minutes": 95 }
  ],
  "advisories": [ { "id": "uuid", "headline": "...", "severity": "watch", "expires_at": "...", "source": "incois" } ],
  "fishing_zones": [ { "id": "uuid", "origin": "orca_heuristic", "score": 72, "risk_level": "safe",
                       "geometry": { "type": "Point", "coordinates": [76.1, 9.9] } } ],
  "missing": [],
  "rules_version": "2026.10.0",
  "disclaimer": "Official warnings override ORCA."
}
```

The threshold numbers shown above are illustrative response values only, not recommended thresholds.

When `RISK_OUTPUT_ENABLED=false`: `503 risk_output_paused`.

## Chat (Guest or user)

| Method | Path | Notes |
|---|---|---|
| POST | `/chat/threads/` | body `{}` or `{title?}`. `201 Thread`. Accepts `Idempotency-Key`. |
| GET | `/chat/threads/` | User only. Paginated. Ordered by `-last_message_at`. |
| GET | `/chat/threads/{id}/` | Thread with messages. Owner only (user or same guest session). |
| DELETE | `/chat/threads/{id}/` | Soft delete. `204`. |
| POST | `/chat/threads/{id}/messages/` | Streams `text/event-stream`. |

`POST .../messages/` body: `{"content": "Is it safe to go out from Kochi tomorrow morning?", "location": {"lat": 9.97, "lon": 76.24}?, "vessel_class": "small_craft"?, "turnstile_token"?: "..."}`. `content` 1 to 1,000 chars.

Stream events (each is `event: <name>` then `data: <json>`):

| Event | Data |
|---|---|
| `status` | `{"step":"checking_waves","label":"Checking wave forecast"}` |
| `risk` | a `RiskAssessment` object |
| `map` | `{"layers":[{"id":"fishing-zones","type":"geojson","data":{...}}],"focus":{"lat":..,"lon":..,"zoom":9}}` |
| `token` | `{"text":"..."}` |
| `done` | `{"message_id":"uuid","usage":{"input_tokens":..,"output_tokens":..}}` |
| `error` | standard error body |

Failure cases: `429 rate_limited`, `turnstile_failed`, `llm_budget_exceeded` (the stream still emits `risk` and a template `token` text when risk data is available, followed by `done` with `fallback:true`), `out_of_coverage`.

`Thread`: `{id, title, created_at, last_message_at, messages?: [Message]}`. `Message`: `{id, role, content, payload, created_at}`.

## Locations (User)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/locations/` | | paginated list |
| POST | `/locations/` | `{name, lat, lon, kind}` | `201 Location` |
| GET | `/locations/{id}/` | | `200 Location` |
| PATCH | `/locations/{id}/` | any of `{name, lat, lon, kind}` | `200 Location` |
| DELETE | `/locations/{id}/` | | `204` |

`Location`: `{id, name, lat, lon, kind, created_at}`. Name 1 to 60 chars, unique per user. Max 20 per user (`400 validation_error`, `details.non_field_errors`).

## Alert subscriptions (User)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/alerts/subscriptions/` | | paginated list |
| POST | `/alerts/subscriptions/` | `{location_id, min_level}` | `201` |
| PATCH | `/alerts/subscriptions/{id}/` | `{min_level?, is_active?}` | `200` |
| DELETE | `/alerts/subscriptions/{id}/` | | `204` |

## Advisories (Guest or user): the primary data table

`GET /advisories/`

| Param | Meaning |
|---|---|
| `active` | `true` (default) returns not-expired only |
| `severity` | one or more of `info`, `watch`, `warning`, `severe` |
| `source` | source slug |
| `near` | `lat,lon` returns advisories whose area contains the point |
| `saved` | `true` limits to areas intersecting the user's saved locations (User only) |
| `q` | text search in headline, max 80 chars |
| `ordering` | one of `issued_at`, `-issued_at`, `expires_at`, `-expires_at`, `severity`, `-severity` |
| `page`, `page_size` | pagination |

Item: `{id, headline, body_excerpt, severity, source, issued_at, expires_at, source_url, area_centroid:{lat,lon}}`. `GET /advisories/{id}/` returns the full body and area GeoJSON.

## Dashboard (User)

`GET /dashboard/overview/`

```json
{
  "saved_locations": [ { "location": {"id":"uuid","name":"Fort Kochi"}, "level": "caution", "valid_to": "...", "top_factor": "Wave height 1.8 m" } ],
  "active_advisories_count": 2,
  "alerts_active_count": 1,
  "data_freshness": [ { "source": "open_meteo", "age_minutes": 42, "status": "ok" } ]
}
```

Levels come from cached assessments for each saved location, computed for the next 12 hours.

## Admin

Django admin at `/admin/`. Not part of the API. Protected by Cloudflare Access (`security.md`).

## Docs endpoints

- `/schema/` (OpenAPI), `/docs/` (Swagger or Redoc UI). Enabled in dev and staging. In production they are behind Cloudflare Access.

## Permission matrix (must have tests)

| Endpoint group | Anonymous | Guest session | Verified user | Other user's object | Staff |
|---|---|---|---|---|---|
| health, data-status, csrf | allow | allow | allow | n/a | allow |
| auth entry points | allow | allow | allow | n/a | allow |
| `/auth/me/`, `/me/`, logout | 401 | 401 | allow | n/a | allow |
| `/risk/` | 401 or allow with tight throttle (decision: allow) | allow | allow | n/a | allow |
| chat create, post | allow (creates guest session) | allow own | allow own | 404 | allow own |
| chat list | 401 | 401 | allow own | n/a | own only |
| thread detail, delete | 404 | own only | own only | 404 | 404 |
| locations, alerts | 401 | 401 | own only | 404 | own only |
| advisories | allow | allow | allow | n/a | allow |
| dashboard | 401 | 401 | allow | n/a | allow |

Unverified authenticated users receive `403 email_not_verified` on User endpoints.
