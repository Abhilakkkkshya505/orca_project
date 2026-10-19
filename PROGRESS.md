# ORCA Implementation Progress Tracker

This document tracks the execution phases for building ORCA. Update after each phase.

---

- [x] **Phase 0: Analyse Everything First**
  - [x] Recursively inspect and read every file in `Files/` (20 docs)
  - [x] Read course guidelines and rubric (`Technology and Sustainability Mini Project Guidelines.pdf`)
  - [x] Write `docs/ANALYSIS.md` with complete file inventory, requirements, conflicts, and gaps
  - [x] Write `docs/ASSUMPTIONS.md` recording all architectural and conflict decisions
  - [x] Create `PROGRESS.md` checklist

- [x] **Phase 1: Monorepo Skeleton & Documentation Synchronization**
  - [x] Copy all 20 technical docs into `docs/` and verify integrity
  - [x] Initialize Git repository in `orca/` with LF line endings (`.gitattributes`)
  - [x] Create directory structure (`frontend/`, `backend/`, `infra/`, `.github/workflows/`, `deliverables/`)
  - [x] Add root `.gitignore`, `.gitattributes`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`
  - [x] Print folder tree
  - [x] Commit: `chore(repo): initialize monorepo skeleton and sync documentation`

- [x] **Phase 2: Infrastructure & Development Environment Configuration**
  - [x] Create `infra/docker-compose.yml` (local dev: api, worker, beat, db with PostGIS, redis)
  - [x] Create `infra/docker-compose.prod.yml` (production host with cloudflared)
  - [x] Create backend `Dockerfile` (Python 3.12, GDAL, GEOS, PROJ, uvicorn, non-root user)
  - [x] Create `.env.example` for backend and frontend
  - [x] Create `infra/scripts/` (`backup.sh`, `restore.sh`, `deploy.sh`, `dev-up.ps1`, `dev-reset.ps1`)
  - [x] Create `infra/cloudflared/config.example.yml`
  - [x] Create CI/CD workflows (`backend-ci.yml`, `frontend-ci.yml`, `deploy-backend.yml`)
  - [x] Verify Docker Compose configurations and local runtime scripts
  - [x] Commit: `feat(infra): configure Docker Compose, Dockerfile, scripts and CI workflows`

- [x] **Phase 3: Django Backend Foundation (Core, Accounts, Auth)**
  - [x] Setup `backend/pyproject.toml` with pinned packages and configuration
  - [x] Configure settings split: `base.py`, `dev.py`, `prod.py`, `test.py`
  - [x] Implement `apps/core/`: `TimeStampedModel`, `PublicIdModel`, `exceptions.py`, `cloudflare.py` (trusted proxy & Access JWT), health views
  - [x] Implement `apps/accounts/`: `CustomUser` (email login, public_id), auth views (signup, verify-email, resend, login, logout, me, password reset/confirm/change, delete account), `turnstile.py`, throttles
  - [x] Add database migrations for core and accounts
  - [x] Unit & permission matrix tests for accounts & auth (13/13 passing)
  - [x] Commit: `feat(auth): implement core models, custom user, session auth, turnstile and security middleware`

- [x] **Phase 4: Geodata Ingestion, Deterministic Risk Engine, Agents, and API Endpoints**
  - [x] Implement `apps/geodata/`: models (`DataSource`, `GridCell`, `ForecastSnapshot`, `Advisory`), adapters (`OpenMeteoAdapter`, `CopernicusAdapter`, `NASAAdapter`, `INCOISAdapter`), Celery tasks
  - [x] Implement `apps/risk/`: `thresholds.py`, pure deterministic `rules.py` (100% branch coverage), `RiskAssessment`, `FishingZone`
  - [x] Implement `apps/agents/`: schemas, orchestrator, specialist agents (weather, ocean state, satellite, fishing zone, advisory), `validators.py` (number hallucination check), prompt templates, LLM client
  - [x] Implement `apps/chat/`: `Thread`, `Message`, SSE streaming view (`/api/v1/chat/threads/{id}/messages/`)
  - [x] Implement `apps/locations/`: `SavedLocation`, `AlertSubscription`, alert evaluation task
  - [x] Implement `apps/dashboard/`: overview endpoint
  - [x] Implement `apps/auditlog/`: `AuditEntry`, admin audit logging mixin
  - [x] Implement management commands (`ingest_all`, `seed_demo_data`, `prune_snapshots`, `evaluate_alerts`, `export_user_data`, `delete_user`)
  - [x] Comprehensive pytest suite (44/44 passing: risk engine 100% branch coverage, validator tests, permission matrix tests, geodata idempotency)
  - [x] Export OpenAPI schema via drf-spectacular (`schema.yml`)
  - [x] Commit: `feat(backend): implement geodata ingestion, deterministic risk engine, agents, and SSE chat API`

- [x] **Phase 5: Frontend Shell, Design System & Auth Flows**
  - [x] Setup Vite + React + TypeScript in `frontend/`
  - [x] Configure Tailwind with semantic tokens from `design.md` (`styles/tokens.css`)
  - [x] Implement design tokens, typography (IBM Plex Sans / Mono), custom SVG risk icons
  - [x] Generate typed API client from OpenAPI schema (`lib/api/generated/`)
  - [x] Build shared UI primitives (`Button`, `Input`, `Skeleton`, `RiskBadge`, `RiskIcon`)
  - [x] Implement auth screens (`/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`)
  - [x] Routing with `RequireAuth` guard and `sanitizeNextPath` open-redirect protection
  - [x] Vitest unit tests for components, schemas, and security (8/8 passing)
  - [x] Commit: `feat(frontend): initialize Vite SPA, design system tokens, API client, and authentication pages`

- [x] **Phase 6: Interactive Features (Chat, Map, Risk Card, Dashboard, Locations, Advisories)**
  - [x] Implement MapLibre GL component with PMTiles / GeoJSON vector sources (`location-marker`, `fishing-zones`, `advisory-areas`)
  - [x] Implement text alternatives and accessible keyboard map controls ("Use this point")
  - [x] Implement `useChatStream` SSE client with live message rendering
  - [x] Build `RiskCard` and `FactorRow` showing data ages, valid window, thresholds, and disclaimer
  - [x] Build Dashboard overview with saved locations status and data freshness indicators
  - [x] Build Saved Locations CRUD and Alert Subscriptions
  - [x] Build Advisories data table with server-side sort, filter, and pagination
  - [x] Build Settings page (units toggle, vessel class, password change, account deletion)
  - [x] Unit tests for RiskCard, FactorRow, SSE split parser (20/20 Vitest passing)
  - [x] Commit: `feat(frontend): implement map, SSE streaming chat, risk card, dashboard, and advisories table`

- [x] **Phase 7: Public Pages, 404, Privacy, Terms, Accessibility & SEO**
  - [x] Build Landing Page (left-aligned real sample risk card and map, genuine copy, no banned slop)
  - [x] Build branded 404 Page (`/404`)
  - [x] Build Privacy Policy and Terms of Service (customized to ORCA data retention, DPDP Act 2023, and GDPR)
  - [x] Build Accessibility statement page (`/accessibility`, WCAG 2.1 AA, high contrast, redundant risk encoding)
  - [x] Configure SEO files: `robots.txt`, `sitemap.xml`, `_headers`, `_redirects`
  - [x] Cookie and consent banner (`ConsentBanner`)
  - [x] Commit: `feat(frontend): implement landing page, public legal pages, accessibility statement, and SEO headers`

- [ ] **Phase 8: Progressive Web App (PWA) & Standalone Offline Underwater Mini-Game**
  - [ ] Configure `vite-plugin-pwa` with custom service worker (`sw.ts`)
  - [ ] Implement runtime caching strategies for navigation, static assets, and cached API responses
  - [ ] Build standalone `offline.html` + HTML5 canvas underwater fish game (swimming fish, food, jellyfish/sharks hazards, score, highscore in guarded localStorage, keyboard & touch controls, reduced-motion mode)
  - [ ] Build auto-reconnection detector (`reconnect.ts`) pinging `/api/v1/health/live/`
  - [ ] Commit: `feat(pwa): implement custom service worker caching, offline fallback, and underwater canvas mini-game`

- [ ] **Phase 9: Comprehensive Testing, Quality Gates & Security Hardening**
  - [ ] Run backend tests (`pytest --cov`) verifying 100% risk & validator coverage and permission matrix
  - [ ] Run Django production check (`python manage.py check --deploy`)
  - [ ] Run frontend unit and component tests (`pnpm test`)
  - [ ] Run Playwright end-to-end tests for key user journeys
  - [ ] Run security & vulnerability audits (`pip-audit`, `pnpm audit`)
  - [ ] Verify accessibility standards with Axe
  - [ ] Commit: `test(e2e): verify test suites, security checks, accessibility compliance, and quality gates`

- [ ] **Phase 10: Course Deliverables, Code Walkthrough & Final Documentation**
  - [ ] Generate comprehensive Academic Project Report (9 chapters complying with 2026CSAE102 rubric) in `deliverables/`
  - [ ] Generate Presentation slides / creatives in `deliverables/`
  - [ ] Generate Business Model Canvas (BMC) & Sustainability Impact document in `deliverables/`
  - [ ] Generate 5-Minute YouTube Project Journey & Demo Video Script in `deliverables/`
  - [ ] Generate LinkedIn Blog Post in `deliverables/`
  - [ ] Write `docs/MANUAL_SETUP.md` with human deployment checklist
  - [ ] Write `docs/CODE_WALKTHROUGH.md` with line-by-line explanations of critical files
  - [ ] Polish root `README.md`
  - [ ] Commit: `docs(deliverables): add academic project report, course deliverables, walkthrough, and setup manual`
