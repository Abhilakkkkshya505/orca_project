# CLAUDE.md

Instructions for AI coding agents working in this repo. Keep changes small, tested and honest.

## What this is

ORCA: a multi-agent assistant that turns ocean and weather data into a safety rating and fishing-zone guidance for a place. Django + DRF backend, Vite + React + TypeScript frontend, Cloudflare in front. Safety-critical: a wrong "safe" can hurt people.

## Read first

1. `docs/ignore.md` (banned patterns and the pre-merge checklist)
2. The doc for the area you touch: `docs/backend.md`, `docs/frontend.md`, `docs/auth.md`, `docs/api.md`, `docs/database.md`
3. `docs/architecture.md` for the data model, agents and risk engine

## Commands

Backend (from `backend/`, inside the `api` container or a venv):

```bash
pytest
ruff check . && ruff format --check .
mypy .
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file schema.yml --validate
python manage.py check --deploy --settings=config.settings.prod   # needs dummy env, see CI
```

Frontend (from `frontend/`):

```bash
pnpm lint && pnpm typecheck && pnpm test --run
pnpm build
pnpm api:generate        # regenerate API types after schema changes
pnpm e2e                 # Playwright
```

Local stack: `docker compose -f infra/docker-compose.yml up -d --build`. Use `app.localtest.me` and `api.localtest.me`, not `localhost`, so cookies are shared.

## Hard rules (the short list)

- **Risk level is decided only by `backend/apps/risk/rules.py`.** Never by an LLM, an agent or the frontend.
- **Missing or stale data means `unknown`. Never default to `safe`.**
- **LLM text must not contain numbers that are not in the structured results.** Keep `agents/validators.py` in the path.
- **No external data calls during a user request.** Ingestion tasks only.
- Business logic goes in `services.py`. Views and serializers stay thin. Never `fields = "__all__"`.
- Every endpoint has an explicit permission class and a permission test. `AllowAny` only for endpoints listed as public in `docs/api.md`.
- No secrets in code. Env vars only. Update `.env.example` and `docs/deployment.md` when adding one.
- Do not edit an applied migration. Add a new one. Follow expand and contract.
- Frontend: TypeScript strict, no `any`, no `@ts-ignore`, components under 200 lines, tokens from `design.md` only, no raw hex.
- Risk is always shown with icon, word and colour, plus its valid window and data age.
- No banned words, lorem ipsum, fake stats or emoji icons (see `docs/ignore.md`).
- Do not invent packages, APIs, Cloudflare features or config options. If unsure, say so and check the docs. Verify package names and versions on the registry before adding.

## Conventions

- Branches `type/short-description`. Commits `type(scope): summary` (Conventional Commits). See `docs/contributing.md`.
- Backend formatting and lint: ruff only. Frontend: ESLint + Prettier.
- API changes: update `docs/api.md`, regenerate the schema and frontend types in the same PR.
- Risk rule, threshold, prompt or advisory-parser changes: bump `RULES_VERSION` where relevant, add boundary tests, request a second reviewer.
- User-visible changes go in `CHANGELOG.md` under `Unreleased`.

## Where things live

| Need | Path |
|---|---|
| Risk rules and thresholds | `backend/apps/risk/` |
| Agents, orchestrator, LLM client, validator, prompts | `backend/apps/agents/` |
| Data adapters and ingestion tasks | `backend/apps/geodata/` |
| Auth and Turnstile | `backend/apps/accounts/` |
| Cloudflare IP and Access JWT helpers | `backend/apps/core/cloudflare.py` |
| Chat SSE view | `backend/apps/chat/views.py` |
| Frontend features | `frontend/src/features/` |
| UI primitives | `frontend/src/components/ui/` |
| Offline page and game | `frontend/src/offline/` |
| Deploy scripts and compose files | `infra/` |

## Do

- Write the test first for risk rules and permissions.
- Handle loading, empty and error states in every data view.
- Keep diffs focused. Mention anything you noticed but did not change.
- Report the real output of the commands you ran.

## Don't

- Don't refactor unrelated code or add unrequested features.
- Don't add comments that restate the code.
- Don't leave `TODO`, `console.log`, `print` or commented-out code.
- Don't trust `X-Forwarded-For` or `CF-Connecting-IP` outside `core/cloudflare.py`.
- Don't put real user data, keys or chat text in fixtures, logs or prompts.
- Don't touch production settings, Cloudflare config or secrets from an agent session.
- Don't mark work done without running the checks above.

## When unsure

Stop and ask. A short question is cheaper than a wrong safety statement.
