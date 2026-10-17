# Observability

Goal: know before users do when ORCA is wrong, stale or down. Stale data matters as much as downtime, because a stale "safe" is the worst failure.

## 1. Structured logging

- Library: `structlog` rendering JSON to stdout. Docker collects it. Ship to a log service later if needed (verify options and costs).
- Standard fields on every line: `timestamp`, `level`, `event`, `request_id`, `user_public_id` (or `guest`), `path`, `method`, `status`, `duration_ms`, `environment`, `release`.
- `request_id`: use `CF-Ray` if present, else a generated ULID. Returned in the `X-Request-ID` response header and in error bodies.
- Never log: passwords, tokens, session IDs, CSRF tokens, full email addresses (log a hash or the domain), full chat text at `INFO`, precise coordinates (round to 3 decimals), API keys.
- Chat content is logged only at `DEBUG` in development.
- Levels: `INFO` for request summaries and task results, `WARNING` for degraded paths (fallback used, source stale), `ERROR` for failures needing attention.
- Log rotation: Docker `json-file` with size limits. Retention 30 days.

Events worth naming consistently:

| Event | Fields |
|---|---|
| `risk.assessed` | level, vessel_class, missing_count, max_data_age_min, rules_version |
| `chat.answered` | thread, intent, agents, llm_in_tokens, llm_out_tokens, fallback, duration_ms |
| `chat.validator_rejected` | reason, retry |
| `ingest.finished` | source, records, duration_ms |
| `ingest.failed` | source, error_class |
| `auth.login_failed` | reason (no email) |
| `throttle.hit` | scope |
| `access.denied` | reason (admin JWT failures) |
| `llm.budget_exhausted` | |

## 2. Error tracking (Sentry)

- Backend: `sentry-sdk` with Django, Celery and logging integrations. Frontend: Sentry browser SDK.
- `send_default_pii=False`. A `before_send` hook scrubs emails, cookies and authorization headers.
- Tags: `environment`, `release` (git SHA), `request_id`.
- Frontend source maps uploaded in CI (hidden from the public bundle).
- Sample rate for performance traces: low (start 0.05) to control cost.
- Release tracking: CI creates a Sentry release on deploy.
- Ignore known noise: aborted fetches on navigation, `ResizeObserver loop` warnings. Write each ignore with a comment explaining why.

## 3. Health check endpoints

| Endpoint | Meaning | Checks |
|---|---|---|
| `/api/v1/health/live/` | process is running | none, returns 200 |
| `/api/v1/health/ready/` | ready to serve | DB `SELECT 1`, Redis `PING`, migrations applied |
| `/api/v1/data-status/` | data freshness (public) | per source age and status |

Docker healthchecks use `live`. External uptime monitors use `ready` and `data-status`.

Source status rules: `ok` when age is under 1.5 times `expected_interval_minutes`, `stale` between 1.5 and 3 times, `failing` beyond 3 times or when the last run errored twice in a row.

## 4. Metrics

MVP uses logs and Sentry plus a small set of counters exposed on a private metrics endpoint. Option: `django-prometheus` and `celery` exporter (verify packages), scraped by a self-hosted Prometheus or a hosted agent later. The endpoint is not routed through the Tunnel.

Key metrics:

| Metric | Why |
|---|---|
| Requests by status and endpoint, latency p50 and p95 | API health |
| Chat time to first event, time to done | user-perceived speed |
| LLM tokens per day vs budget | cost control |
| Validator rejection rate | prompt or model drift |
| Fallback (template) rate | LLM trouble or budget |
| Ingestion success rate and age per source | data health |
| Share of risk answers that are `unknown` | coverage or data gaps |
| Celery queue length and task failure rate | worker health |
| DB connections, slow queries | capacity |
| Throttle hits per scope | abuse or limits too tight |
| Turnstile failures | bot pressure or widget issues |

## 5. Alerting

Route to one place (email or a chat webhook) with clear severity.

| Condition | Severity | Action |
|---|---|---|
| `ready` fails for 2 minutes | page | check containers, DB, Redis |
| Any source `failing` for over 3 cycles | page | check provider, credentials, parser |
| Any source `stale` | warning | watch |
| `unknown` share over 40 percent for 30 minutes | warning | likely data issue |
| Error rate over 2 percent for 5 minutes | page | check Sentry |
| Chat p95 full answer over 20 s for 10 minutes | warning | LLM latency |
| LLM budget over 80 percent before 18:00 local | warning | review traffic |
| Validator rejection rate over 10 percent | warning | prompt or model regression |
| Disk over 80 percent on VPS | warning | prune, expand |
| Backup job failed or missing | page | fix before next night |
| Restore test failed | page | |
| Certificate or domain expiry within 21 days | warning | |
| Access denied spikes on `/admin/` | warning | possible probing |

Alert thresholds are starting points. Review them after the first month with real data.

## 6. Dashboards

One page showing: request rate and errors, chat latency, data age per source, `unknown` share, LLM tokens vs budget, queue length. Build in the metrics tool you choose. Until then, `GET /api/v1/data-status/` plus Sentry and logs are the dashboard.

## 7. Degraded-mode behaviour (documented and tested)

| Failure | What users see | What the system does |
|---|---|---|
| LLM provider down or budget used | Risk card and template text, banner "Chat explanation unavailable" | `fallback:true`, alert |
| One data source stale | Affected factors show "No recent data", level may be `unknown` | alert, source status |
| Advisory source failing | Level cannot be `safe` unless the advisory freshness requirement is met, so usually `unknown` | alert |
| Redis down | Reads work slowly. Throttles fall back to a conservative in-process limit. Chat for guests is paused. | alert page |
| DB down | Error page with retry. Offline cache still shows last advisories. | alert page |
| Whole API down | PWA shows offline page with cached advisory summary and its age | uptime alert |

## 8. Audit trail for safety statements

Every risk answer creates an immutable `RiskAssessment` with factors, data ages and `rules_version`. For any complaint or incident, support can reconstruct what ORCA said and why. Access to these rows is staff-only and read-only in admin.

## 9. Privacy in telemetry

- No analytics without consent. If analytics are added, use a privacy-respecting, cookieless option (verify) and list it in the Privacy Policy and consent banner.
- Sentry session replay is off.
- Telemetry contains no precise user location and no chat text.

## 10. Runbook stubs

Create `docs/runbooks/` with one short file per alert: symptom, likely causes, first checks, fix, who to tell. Start with: `source-failing.md`, `ready-failing.md`, `llm-budget.md`, `restore.md`, `risk-paused.md`.
