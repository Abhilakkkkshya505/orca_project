# Backend Conventions (Django 5 + DRF)

Read `architecture.md` first. Rules that apply everywhere are in `ignore.md`.

## 1. Stack

Python 3.12+, Django 5.x, Django REST Framework, drf-spectacular, django-cors-headers, django-environ, psycopg 3, redis-py, django-redis, Celery, uvicorn, WhiteNoise, django-storages (S3 API for R2), structlog, sentry-sdk, pydantic (agent schemas), pytest, pytest-django, factory_boy, ruff, mypy with django-stubs.

Versions are pinned in `pyproject.toml` with a lockfile. Verify every package name and version against PyPI before adding (`pip index versions <name>`).

## 2. Settings split

```
config/settings/
  base.py   shared; reads env via django-environ; no secrets with defaults
  dev.py    DEBUG on, console email, relaxed cookies for *.localtest.me
  prod.py   DEBUG off, secure cookies, HSTS, strict hosts and CORS
  test.py   fast password hasher, in-memory email, eager Celery
```

- `DJANGO_SETTINGS_MODULE` is set per environment. There is no default to `prod`.
- Missing required env vars raise at startup. No silent fallback for `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`.
- `prod.py` runs `check --deploy` in CI with dummy env values.

## 3. App boundaries

| App | Owns | May import from |
|---|---|---|
| `core` | base models, exceptions, pagination, Cloudflare helpers | nothing in `apps/` |
| `accounts` | User, auth | `core` |
| `geodata` | sources, snapshots, advisories | `core` |
| `risk` | rules, assessments | `core`, `geodata` (types only) |
| `agents` | orchestrator, agents, LLM client | `core`, `geodata`, `risk` |
| `chat` | threads, messages, SSE | `core`, `agents`, `risk`, `accounts` |
| `locations` | saved locations, alerts | `core`, `accounts`, `risk` |
| `dashboard` | overview endpoint | read-only access to others through their services |
| `auditlog` | audit entries | `core`, `accounts` |

No circular imports. `risk/rules.py` imports nothing from Django.

## 4. Layering

```
View (HTTP only) -> Serializer (shape + validation) -> Service (logic) -> Model/Queryset (data)
```

- **Views:** authenticate, authorise, parse, call one service function, serialise the result. No branching business logic.
- **Serializers:** field validation and representation. No queries beyond what `select_related` already loaded. No side effects.
- **Services (`services.py`):** plain functions or small classes. Take typed arguments, return model instances or dataclasses. Wrap multi-step writes in `transaction.atomic()`.
- **Models:** fields, constraints, simple properties. Custom `QuerySet` classes for reusable filters (`Advisory.objects.active().intersecting(point)`).
- Prefer a service layer over fat models. Models do not send email, call APIs or enqueue tasks.

## 5. Base models

```python
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: abstract = True

class PublicIdModel(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    class Meta: abstract = True
```

- Clients only ever see `public_id`. URL kwargs use `public_id`.
- Soft delete is used only for `chat.Thread` (user can restore within 30 days) and nowhere else. Everything else hard deletes. Account deletion removes personal data (see `security.md`).
- Every foreign key sets `on_delete` deliberately. Default to `PROTECT`, use `CASCADE` only for owned children.

## 6. Serializers

- Always list `fields`. `__all__` is banned.
- Separate read and write serializers when shapes differ (`RiskAssessmentSerializer`, `RiskQuerySerializer`).
- Validation rules match the Zod schemas in the frontend. When a rule changes, change both in one PR. The shared rules are listed in `api.md` per endpoint.
- Coordinates: latitude -90..90, longitude -180..180, and a coastal bounding box check against `COVERAGE_BBOX` with a clear error for out-of-coverage points.

## 7. Permissions

- Default DRF permission is `IsAuthenticated`. Set in settings. Public endpoints opt out explicitly with `permission_classes = [AllowAny]` and are listed in `api.md` under "Public".
- Object permissions through querysets: `get_queryset()` filters by `request.user`. Do not rely on `get_object()` checks alone.
- Guest chat uses `GuestOrAuthenticated`, which requires a valid Django session (anonymous sessions are created on first chat).
- Staff-only endpoints use `IsAdminUser` and are not exposed in the frontend.

## 8. Pagination and filtering

- `PageNumberPagination`, `page_size=25`, `max_page_size=100`, `page_size_query_param="page_size"`. Response shape `{count, next, previous, results}`.
- Filtering with explicit `FilterSet` classes (django-filter, verify package). Allowed `ordering_fields` are listed per view.
- Every filter and ordering field has an index or a documented reason it does not need one.

## 9. Exceptions

`core/exceptions.py` defines:

```python
class DomainError(Exception): code = "domain_error"; status = 400
class OutOfCoverage(DomainError): code = "out_of_coverage"
class DataUnavailable(DomainError): code = "data_unavailable"; status = 503
class LlmBudgetExceeded(DomainError): code = "llm_budget_exceeded"; status = 503
class TurnstileFailed(DomainError): code = "turnstile_failed"; status = 400
```

A DRF `exception_handler` converts `DomainError`, DRF exceptions, `Http404`, `PermissionDenied` and unexpected errors into the standard error body. Unexpected errors return `internal_error` with the request ID and are reported to Sentry.

## 10. Management commands

All commands live in `apps/<app>/management/commands/`. Rules: idempotent, log with structlog, exit non-zero on failure.

| Command | Purpose |
|---|---|
| `ingest_all` | run every enabled source adapter once |
| `ingest_source <slug>` | run one adapter |
| `prune_snapshots` | delete expired forecast snapshots |
| `seed_demo_data` | create demo user, locations, synthetic snapshots (dev and staging only) |
| `evaluate_alerts` | run alert evaluation once |
| `export_user_data <email>` | JSON export for a data-access request |
| `delete_user <email>` | full account deletion procedure |

## 11. Signals policy

Signals are not used for business logic. Allowed only for: `post_migrate` setup (groups, default `DataSource` rows). Everything else is an explicit service call.

## 12. Celery

- Broker and result backend: Redis. Results are not stored unless a task needs them (`ignore_result=True` by default).
- Task rules:
  1. Tasks are thin. They call a service function.
  2. Arguments are primitives or IDs, never model instances.
  3. Every task is **idempotent**. Re-running it must not duplicate data. Ingestion uses `get_or_create` or unique constraints with `ON CONFLICT DO NOTHING`.
  4. Set `acks_late=True`, `time_limit`, `soft_time_limit` and a bounded `autoretry_for` with exponential backoff.
  5. No task calls another task synchronously.
- Beat schedule in `config/celery.py`:

| Task | Schedule | Notes |
|---|---|---|
| `ingest_open_meteo` | every 3 hours | adjust to provider update cycle |
| `ingest_copernicus` | every 6 hours | check product update cadence |
| `ingest_ocean_colour` | daily | cloud gaps expected |
| `ingest_advisories` | every 30 minutes | hash-compare, store only changes |
| `evaluate_alerts` | after each ingestion and hourly | |
| `prune_snapshots` | daily | |
| `check_data_freshness` | every 15 minutes | alerts if a source misses 2 cycles |

Schedules are starting points. Confirm them against each provider's actual update cycle.

## 13. Idempotency

- Ingestion: unique constraints on snapshots and advisories. Re-ingesting the same file changes nothing.
- Alerts: `last_notified_level` and `last_notified_at` prevent duplicate emails for the same level within 6 hours.
- Account actions (verify email, reset password) use single-use tokens that are invalidated on use.
- Client retries of `POST` that create resources accept an optional `Idempotency-Key` header on `/chat/threads/` and `/locations/`. Keys are stored in Redis for 24 hours.

## 14. Agent code rules

- Agents are plain functions in `apps/agents/agents/`. They read through `geodata.services`, never through raw ORM in the agent.
- Output types are Pydantic models in `agents/schemas.py`.
- `agents/llm.py` is the only module that imports the LLM SDK. It exposes `extract_intent()` and `write_explanation()`.
- `agents/validators.py` contains the number-checking validator. It has its own test file with adversarial cases.
- Prompts are files under `agents/prompts/` with a version string. Changing a prompt requires updating its eval fixtures in `tests/agents/evals/`.

## 15. SSE view

The streaming chat view is the only async view. It:
1. Authenticates and throttles synchronously (before the stream starts).
2. Runs agents with `sync_to_async` or a threadpool, since they use the ORM.
3. Yields events: `status`, `risk`, `map`, `token`, `done`, `error`.
4. Closes cleanly if the client disconnects, and records the partial message.
5. Sets `Cache-Control: no-cache` and `X-Accel-Buffering: no`. Verify Cloudflare does not buffer the stream for your plan and configuration.

## 16. Code quality

- `ruff check` and `ruff format` are the only lint and format tools. (Do not also run black.)
- `mypy` with `django-stubs` in strict mode for `apps/risk`, `apps/agents`, `apps/core`. Gradual elsewhere, with a plan to tighten.
- Type hints on all public service functions.
- Docstrings only where behaviour is not obvious from the signature.
