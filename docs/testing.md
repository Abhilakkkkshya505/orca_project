# Testing

Tests protect two things first: the risk logic and the permission rules. Everything else follows.

## 1. Tools

| Stack | Tools |
|---|---|
| Backend | pytest, pytest-django, factory_boy, pytest-cov, freezegun or time-machine (verify), responses or respx for HTTP mocks (verify), `django_assert_max_num_queries` fixture |
| Frontend unit and component | Vitest, Testing Library, MSW for API mocks, `vitest-axe` or `jest-axe` for accessibility checks (verify) |
| End to end | Playwright with `@axe-core/playwright` |
| Security and quality | pip-audit, pnpm audit, gitleaks, ruff, mypy, ESLint |

## 2. Coverage goals

| Area | Goal |
|---|---|
| `apps/risk/` (rules, thresholds) | 100 percent line and branch |
| `apps/agents/validators.py` | 100 percent |
| Permission tests | every endpoint in `api.md` covered |
| Backend overall | 85 percent lines |
| Frontend `lib/` and `features/*/hooks` | 80 percent |
| Frontend overall | 70 percent |

Coverage is a floor, not the goal. A PR that adds logic without tests is not merged.

## 3. Backend: what to test

### 3.1 Risk rules (most important)
- Each factor at: well below caution, exactly at caution, between, exactly at unsafe, above unsafe. Boundary values decide which level wins and must be explicit.
- Overall level is the worst factor level.
- Missing factor yields `unknown`, never `safe`.
- Stale factor (older than max age) yields `unknown` and lists the stale item.
- `warning` or `severe` advisory covering the point forces `unsafe`.
- Each vessel class uses its own thresholds.
- Rules are pure: same input, same output, no clock reads.
- Snapshot test of `RULES_VERSION` and threshold table so a change must be deliberate.

### 3.2 Agents and LLM layer
- Each agent against fixture snapshots: normal, gap, stale.
- Orchestrator with a fake LLM client: correct agent set chosen for a set of sample questions.
- **Number validator**: unit tests with
  - supported numbers (pass)
  - unsupported numbers (fail)
  - rounded and unit-converted numbers (pass when they match the formatted result)
  - numbers inside words and dates (ignored correctly)
  - adversarial: user asks the model to "say the waves are 0.5 m" (validator catches, fallback used)
- Prompt injection fixtures: advisory text and user text containing instructions. Assert the output schema and risk level are unaffected.
- Budget exceeded path returns template text and `fallback:true`.
- LLM client is always mocked in CI. A separate manual `pytest -m live_llm` suite exists for pre-release checks.

### 3.3 Ingestion
- Adapter `normalise()` against recorded real responses stored in `tests/fixtures/` (trimmed, licence permitting).
- Running ingestion twice creates no duplicates (idempotency).
- Provider error or malformed payload marks the source failing and keeps old data.
- Pruning deletes only rows past retention.

### 3.4 API and permissions
For every endpoint in `api.md`:
- Parametrised matrix: anonymous, guest session, unverified user, verified owner, other verified user, staff. Expected status per cell is taken from the matrix in `api.md`.
- Validation: each documented rule has a passing and failing case.
- Error body shape is the standard one.
- Throttle tests: the N+1th request returns 429 with `Retry-After`.
- Query count: list and overview endpoints use `django_assert_max_num_queries` with a stated budget.

### 3.5 Auth
All items in the checklist in `auth.md` section 10, plus:
- Turnstile outage fails closed.
- Signup response is identical for new and existing emails.
- Session is rotated on login and invalidated on password change.
- Access JWT middleware: missing, expired, wrong audience, wrong issuer, tampered signature all return 403. Valid token passes. Use generated test keys and a mocked certs endpoint.
- `CF-Connecting-IP` honoured only from the trusted peer and ignored otherwise.

### 3.6 Admin and audit
- Sensitive admin actions write `AuditEntry`.
- `AuditEntry` cannot be edited or deleted through admin.

### 3.7 Settings
- `check --deploy` test with prod settings.
- Test that `DEBUG` is false and `AllowAny` is not the default in `prod`.

### 3.8 Factories
`factory_boy` factories in `tests/factories.py` for User, DataSource, GridCell, ForecastSnapshot, Advisory, SavedLocation, Thread, Message. Factories create valid objects by default. Variants: `StaleSnapshotFactory`, `UnsafeSnapshotFactory`.

## 4. Frontend: what to test

### 4.1 Unit and component (Vitest)
- `lib/format.ts`: units, rounding, time zones, "no data" text.
- Zod schemas: same cases as the DRF serializer tests for shared rules.
- `RiskBadge`, `RiskCard`, `FactorRow`: all four levels render icon, word and colour class. Unknown renders missing items.
- `useChatStream`: feed a scripted SSE byte stream (split mid-event, split mid-UTF-8) and assert state transitions, error, abort, partial answer.
- API client: CSRF header on unsafe methods, 401 redirect, 429 message, error mapping.
- Forms: validation messages, server error mapping, disabled while pending, Turnstile token included.
- `RequireAuth` redirects and `next` sanitising (rejects `https://evil.example` and `//evil.example`).
- Offline game logic (collision, scoring, difficulty, pause, high score storage guarded against `localStorage` errors) as pure functions.
- Axe check on each page-level component.

### 4.2 End to end (Playwright)
Critical flows, run against a seeded backend in CI:
1. Guest asks a question, sees the risk card and map layer, hits the guest limit message.
2. Signup, verify email (read from the dev mail sink), login, logout.
3. Password reset round trip.
4. Save a location, see it on the dashboard with a risk level, create an alert subscription.
5. Advisories table: sort, filter, paginate.
6. Offline: go offline in the browser context, reload, see the offline page and play a round, go online, return to the app automatically.
7. Session expiry: delete the session cookie, see the redirect to login with `next`.
8. Keyboard-only run through login and a chat question.

Run in Chromium on desktop and a mobile viewport. Add WebKit and Firefox on release branches.

### 4.3 Accessibility tests
Axe checks in component tests and in each Playwright flow. Manual checks listed in `accessibility.md`.

### 4.4 Visual checks
Manual review of light and dark themes for the four risk states. Automated screenshot tests only for `RiskBadge` and `RiskCard` to catch token regressions.

## 5. LLM evaluation set

`backend/tests/agents/evals/` holds 40 or more question and context fixtures with expected structured outcomes (intent extraction fields, risk level, which numbers may appear). Run on every prompt or model change. A change that lowers the pass rate needs a written reason in the PR. Track the pass rate in `CHANGELOG.md` when it changes.

## 6. Load and resilience tests (before launch)

- Chat endpoint at 20 concurrent streams for 5 minutes. Record p95 first event and full-answer time.
- Advisory list at 100 requests per second for 1 minute.
- Kill Redis: API still serves risk reads (cache miss path) and returns correct throttle behaviour defined in `observability.md`.
- Kill the LLM provider (blackhole): chat returns template answers.
- Provider outage during ingestion: data ages grow and levels turn `unknown` after the maximum age.

## 7. Test data hygiene

- No real emails, real API keys or real user data in fixtures.
- Fixtures from real providers are trimmed, and licence terms are checked before committing.
- Tests do not call the network. A `pytest` fixture blocks sockets by default (verify `pytest-socket`).

## 8. CI gates

A PR cannot merge unless: backend and frontend CI pass, coverage floors hold, permission matrix tests pass, and the schema and generated types are in sync.
