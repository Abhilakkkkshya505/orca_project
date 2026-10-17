# Database

PostgreSQL with the PostGIS extension. Django ORM with `django.contrib.gis`. Field-level definitions are in `architecture.md` section 6. This file covers policy, indexes, constraints, seeding and backups.

## 1. Setup

- Image for local and production single-host: `postgis/postgis` (pin a tag; verify current supported Postgres and PostGIS versions).
- Extensions enabled by the first migration: `postgis`. Add `citext` or use a lowercased unique index for email. Decision: unique functional index on `lower(email)` and normalise email to lowercase in `UserManager`.
- Database encoding UTF-8, time zone UTC (`USE_TZ=True`, `TIME_ZONE="UTC"`).
- Connection: `DATABASE_URL`, psycopg 3, `CONN_MAX_AGE=60`, `CONN_HEALTH_CHECKS=True`.
- Two roles: `orca_app` (DML only, used by the app) and `orca_migrate` (DDL, used by the deploy step). Never run the app as a superuser.

## 2. Schema summary

| Table (app_model) | Purpose | Approx growth |
|---|---|---|
| `accounts_user` | users | slow |
| `geodata_datasource` | one row per source | static |
| `geodata_gridcell` | coastal grid points | static after first fill |
| `geodata_forecastsnapshot` | time series per cell and source | high, pruned at 14 days |
| `geodata_advisory` | official warnings | low |
| `risk_riskassessment` | immutable record of every risk answer | medium |
| `risk_fishingzone` | zones per assessment | medium |
| `chat_thread`, `chat_message` | conversations | medium |
| `locations_savedlocation`, `locations_alertsubscription` | per user | low |
| `auditlog_auditentry` | append-only audit | low |

## 3. Indexes and constraints

| Table | Index or constraint | Reason |
|---|---|---|
| `accounts_user` | unique on `lower(email)`; unique `public_id` | login lookup, no duplicate accounts |
| `geodata_gridcell` | GiST on `geom`; unique (`geom`, `resolution_deg`) | nearest-cell lookup |
| `geodata_forecastsnapshot` | unique (`cell_id`, `source_id`, `valid_time`, `issued_at`); btree (`cell_id`, `valid_time`); btree (`ingested_at`) | idempotent ingest, window queries, pruning |
| `geodata_advisory` | GiST on `area`; btree (`expires_at`, `severity`); unique (`source_id`, `external_id`, `content_hash`) | point-in-area, active filter, dedupe |
| `risk_riskassessment` | btree (`user_id`, `created_at`); GiST on `location` (only if map-history queries are added) | history |
| `chat_thread` | btree (`user_id`, `last_message_at` desc); btree (`session_key`) partial where `user_id IS NULL`; CHECK (`user_id IS NOT NULL OR session_key IS NOT NULL`) | list threads, guest lookup |
| `chat_message` | btree (`thread_id`, `created_at`) | message order |
| `locations_savedlocation` | unique (`user_id`, `name`); btree (`user_id`) | uniqueness, list |
| `locations_alertsubscription` | unique (`user_id`, `location_id`); btree (`is_active`) | evaluation loop |
| `auditlog_auditentry` | btree (`created_at`), btree (`object_type`, `object_id`) | review |

Other constraints:
- CHECK `lat`/`lon` ranges are enforced by PostGIS geometry type plus an SRID check (4326).
- CHECK on enums via Django `TextChoices` plus database check constraints for `level`, `severity`, `kind`.
- CHECK (`valid_to` > `valid_from`) on `RiskAssessment`.
- Foreign keys: `PROTECT` by default. `CASCADE` for `Message` from `Thread`, `FishingZone` from `RiskAssessment`, `SavedLocation` and `AlertSubscription` from `User` (needed for deletion).

Every filtered or ordered column in an API view must appear in the table above or have a documented reason. A CI test inspects `ordering_fields` and `filterset_fields` against indexes using `EXPLAIN` on seeded data for the advisories view.

## 4. Migrations policy

1. One migration per logical change. Names describe the change.
2. Migrations are generated, reviewed and committed with the code that needs them.
3. **Never edit a migration that has been applied to any shared environment.** Add a new one.
4. **Expand and contract** for anything that touches live data:
   - Expand: add nullable columns or new tables, deploy code that writes both.
   - Backfill: run as a management command or data migration in batches, not in one transaction on a big table.
   - Contract: drop old columns in a later release after no code reads them.
5. Adding an index on a large table uses `AddIndexConcurrently` (Django's `django.contrib.postgres.operations`) in a non-atomic migration.
6. Adding a NOT NULL column needs a default or a three-step approach.
7. CI runs `makemigrations --check --dry-run` and fails if model changes lack migrations.
8. CI applies all migrations to an empty PostGIS database and runs the test suite on it.
9. Deploys run `migrate` before the new code starts serving, using the `orca_migrate` role. Migrations must be compatible with the previous app version (that is the point of expand and contract).

## 5. Data retention and pruning

| Data | Retention | Mechanism |
|---|---|---|
| `ForecastSnapshot` | 14 days past `valid_time` | `prune_snapshots` daily |
| Guest `Thread` and `Message` | 30 days after last activity | `prune_guest_threads` daily |
| Soft-deleted `Thread` | 30 days after deletion | same task |
| `RiskAssessment` for guests | 90 days | `prune_assessments` weekly |
| `RiskAssessment` for users | until account deletion | account deletion |
| `AuditEntry` | 12 months | `prune_audit` monthly (the only delete path, run by a command, not admin) |
| Redis caches | TTLs in `architecture.md` | automatic |

## 6. Seeding

- `seed_demo_data` (dev and staging only, refuses to run if `ENVIRONMENT=production`):
  - demo verified user `demo@orca.example` with password from env var `DEMO_PASSWORD`
  - three saved locations on the Indian coast
  - synthetic snapshots for the next 48 hours with one deliberately `caution` and one `unsafe` cell, so every UI state can be seen
  - two sample advisories
  - `DataSource` rows
- Synthetic data is labelled in `values["_synthetic"]=true`. The API adds `"synthetic": true` to the response when any contributing snapshot is synthetic, and the UI shows a "Demo data" banner. Synthetic data must never appear in production.
- Production `DataSource` rows are created by a data migration or `post_migrate` hook, not by seeding.

## 7. Backups

| Item | Policy |
|---|---|
| Logical backup | `pg_dump` (custom format) nightly at a quiet hour, via `infra/scripts/backup.sh` |
| Continuous archive | Optional: WAL archiving with `pgBackRest` or `wal-g` (verify tooling) for point-in-time recovery once the service is live |
| Storage | Encrypted upload to a Cloudflare R2 bucket separate from the data bucket, with lifecycle rules |
| Retention | 14 daily, 8 weekly, 6 monthly |
| Encryption | `age` or `gpg` encryption before upload. Key kept offline by two people. |
| Redis | Not backed up. It holds only caches, throttles and the broker. Loss is acceptable. |
| R2 data bucket | Raw files can be re-fetched from providers. Basemap PMTiles are kept in version control or a second bucket. |

### Backup verification

A monthly job restores the latest dump into a scratch database, runs `SELECT count(*)` on key tables and the test `check_restore` command, and reports the result. A backup that has not been restored is not counted as a backup.

## 8. Restore procedure

1. Stop the API, worker and beat: `docker compose stop api worker beat`.
2. Take a safety dump of the current state if the database still starts.
3. Download and decrypt the chosen backup: `infra/scripts/restore.sh <backup-file>` (script performs steps 3 to 6).
4. Create a fresh database, enable PostGIS, restore with `pg_restore --no-owner --role=orca_migrate -d orca <file>`.
5. Run `python manage.py migrate --check`. If it reports unapplied migrations, apply them.
6. Run `python manage.py check_restore` (row counts, latest `ingested_at`, user count sanity).
7. Start the API. Check `/health/ready/`.
8. Start worker and beat. Trigger `ingest_all` to fill the gap since the backup.
9. Post a status note: data from the gap period was re-ingested from providers where possible. Chat history and user changes after the backup time are lost.

Recovery targets for the MVP: RPO 24 hours (nightly dump), RTO 2 hours. Tighten with WAL archiving after launch.

## 9. Query performance rules

- No query in a request path touches more than 10 tables.
- Point lookups use the nearest grid cell via `GridCell.objects.nearest(point)` implemented with PostGIS KNN (`<->`) on the GiST index.
- List endpoints use `select_related` for FKs and `prefetch_related` for reverse relations, and have `django_assert_max_num_queries` tests.
- No `COUNT(*)` on huge tables in a request. Use bounded queries or cached counts.
- Slow query log threshold 200 ms in production, reviewed weekly.

## 10. Local database tips

- `docker compose exec db psql -U orca -d orca`
- Reset: `docker compose down -v` removes volumes. Re-run `migrate` and `seed_demo_data`.
- Use `pgcli` or any client against `localhost:5432` as mapped in `docker-compose.yml`.
