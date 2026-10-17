# ORCA: Marine Ecosystem Reasoning with Collaborative AI Agents

ORCA turns scattered ocean data (wave and wind forecasts, sea surface temperature, chlorophyll, official advisories) into a plain answer for a specific place: is it safe to go out, what is the risk, and where are fishing zones likely to be. Users ask in a chat and see the answer on a map.

Supports **UN SDG 14: Life Below Water**.

> **Safety statement.** ORCA is decision support, not an official warning service. Official IMD and INCOIS warnings always override ORCA. Every answer shows its data timestamp and sources. If data is missing or stale, ORCA says `unknown`. It never defaults to `safe`.

## Who it is for

- Small-boat fishermen on the Indian coast (primary)
- Coastal authorities and fisheries officers
- Researchers and students
- Coastal residents

## How it works (one paragraph)

Celery jobs ingest forecast, satellite and advisory data on a schedule into PostgreSQL/PostGIS. When a user asks a question, an orchestrator picks specialist agents (weather, ocean state, satellite, fishing zone, advisory). Each agent returns typed data. A **deterministic rules engine** computes the risk level. The LLM only routes the question and writes the explanation from those results. See `docs/architecture.md`.

## Monorepo layout

```
orca/
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
├── .gitignore
├── .github/workflows/
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   └── deploy-backend.yml
├── docs/                      # all project documentation (this folder)
├── frontend/                  # Vite + React + TypeScript SPA (Cloudflare Pages)
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── public/                # manifest icons, _headers, _redirects, robots.txt
│   └── src/
│       ├── app/               # providers, router, error boundary
│       ├── routes/            # route components (thin)
│       ├── features/          # auth, chat, map, dashboard, locations, settings, landing
│       ├── components/        # ui/ (primitives), layout/
│       ├── lib/               # api client, env, format, zod schemas
│       ├── offline/           # standalone offline page + fish game
│       ├── pwa/               # service worker config
│       └── styles/
├── backend/                   # Django 5 + DRF
│   ├── .env.example
│   ├── pyproject.toml
│   ├── manage.py
│   ├── Dockerfile
│   ├── config/                # settings/{base,dev,prod,test}.py, urls, asgi, celery
│   ├── apps/
│   │   ├── core/              # base models, exceptions, pagination, Cloudflare helpers, health
│   │   ├── accounts/          # custom User, auth endpoints, Turnstile
│   │   ├── geodata/           # data sources, snapshots, advisories, ingestion clients
│   │   ├── risk/              # deterministic rules engine, RiskAssessment
│   │   ├── agents/            # orchestrator, tools, agents, LLM client
│   │   ├── chat/              # threads, messages, SSE stream
│   │   ├── locations/         # saved locations, alert subscriptions
│   │   ├── dashboard/         # overview endpoint
│   │   └── auditlog/          # audit entries for admin and sensitive actions
│   └── tests/
└── infra/
    ├── docker-compose.yml         # local dev
    ├── docker-compose.prod.yml    # production host
    ├── cloudflared/config.example.yml
    └── scripts/                   # backup.sh, restore.sh, deploy.sh
```

## Prerequisites

- Docker and Docker Compose
- Node.js (current LTS) and pnpm
- Python 3.12+ (only if running the backend outside Docker)
- Accounts and keys listed in `docs/deployment.md` under "Manual configuration"

## Local setup

```bash
git clone <repo-url> orca && cd orca

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec api python manage.py migrate
docker compose -f infra/docker-compose.yml exec api python manage.py createsuperuser
docker compose -f infra/docker-compose.yml exec api python manage.py seed_demo_data

cd frontend && pnpm install && pnpm dev
```

Local URLs:

| Service | URL |
|---|---|
| Frontend | http://app.localtest.me:5173 |
| API | http://api.localtest.me:8000/api/v1/ |
| API docs | http://api.localtest.me:8000/api/v1/docs/ |
| Admin | http://api.localtest.me:8000/admin/ |

`localtest.me` resolves to 127.0.0.1 and gives the two hostnames that cookie-domain behaviour needs. Do not use `localhost` for both. See `docs/auth.md`.

Use Cloudflare's documented Turnstile test keys for local development. Look them up in the Turnstile docs and do not commit production keys.

## Scripts

Backend (run inside the `api` container or a venv):

| Command | Purpose |
|---|---|
| `pytest` | run tests |
| `ruff check . && ruff format --check .` | lint and format check |
| `mypy .` | type check |
| `python manage.py spectacular --file schema.yml` | export OpenAPI schema |
| `python manage.py check --deploy` | production settings check |
| `python manage.py ingest_all` | run all ingestion jobs once |

Frontend:

| Command | Purpose |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` | production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright |
| `pnpm api:generate` | regenerate API types from the OpenAPI schema |

## Environment variables

Complete lists with comments are in `backend/.env.example` and `frontend/.env.example`. The meaning of each variable is in `docs/deployment.md`. Secrets are never committed.

## Deploy (summary)

1. Frontend: Cloudflare Pages, build `pnpm build`, output `dist`.
2. Backend: Docker Compose on an India-region VPS, exposed only through a Cloudflare Tunnel.
3. Cloudflare: DNS, WAF rules, Turnstile, Access for `/admin/`, R2 bucket.
4. CI builds the backend image and `deploy.sh` rolls it out.

Full steps: `docs/deployment.md`.

## Documentation index

| File | Contents |
|---|---|
| `docs/architecture.md` | system design, data model, agents, risk engine |
| `docs/design.md` | design system |
| `docs/ignore.md` | anti-slop rulebook |
| `docs/backend.md` | Django conventions |
| `docs/frontend.md` | frontend conventions |
| `docs/security.md` | threat model and controls |
| `docs/auth.md` | auth flows |
| `docs/api.md` | endpoint reference |
| `docs/database.md` | schema, indexes, backups |
| `docs/deployment.md` | infrastructure and release |
| `docs/testing.md` | test strategy |
| `docs/observability.md` | logging, errors, health, alerts |
| `docs/accessibility.md` | accessibility requirements |
| `docs/seo.md` | SEO scope |
| `docs/performance.md` | budgets |
| `docs/contributing.md` | workflow and code style |
| `docs/roadmap.md` | MVP, v1, later |

## Verification note

Package names and versions in these docs were written without live registry access. Before the first install, run `pip index versions <pkg>` and `npm view <pkg> version` for each dependency and pin the result in `pyproject.toml` and `package.json`. Data provider terms and API access must also be verified. See `docs/architecture.md`, section "Data sources".

## Licence

To be decided by the project owner. Add a `LICENSE` file before publishing the repository.
