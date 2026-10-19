# ORCA System Analysis & Current State Audit

**Project:** ORCA (Marine Ecosystem Reasoning with Collaborative AI Agents — SDG 14: Life Below Water)  
**Project Root:** `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\orca`  
**Input Location:** `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\Files`  
**Date of Audit:** 19 October 2026  
**Target:** `ANALYSE` (Steps 1 and 2 execution; no application code changed)

---

## 1. Input Folder File Inventory & Expected File Verification

Every file in the input directory `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\Files` was mapped, read, and verified against expected categories.

### 1.1 Category Summary & Present/Missing Status

| Category | Expected Files | Status | Notes |
|---|---|---|---|
| **A: Binding Rules** | `00-CONTEXT-BLOCK.md` | **PRESENT** | Read and enforced. Rules S1–S10 and P1–P12 applied. |
| **B: Task Specifications** | `TASK-0` to `TASK-6`, `README-HOW-TO-USE.md` | **PRESENT** | All 7 task specifications and usage guide present. |
| **C: Technical Spec Docs** | 20 docs (`README.md`, `CLAUDE.md`, `CHANGELOG.md`, `architecture.md`, `design.md`, `ignore.md`, `backend.md`, `frontend.md`, `security.md`, `auth.md`, `api.md`, `database.md`, `deployment.md`, `testing.md`, `observability.md`, `accessibility.md`, `seo.md`, `performance.md`, `contributing.md`, `roadmap.md`) | **PRESENT** | All 20 technical spec documents present in `Files/` and synchronized into `docs/` and root. |
| **D: Key Template** | `backend.env.keys.template` | **PRESENT** | Real keys stay in `backend/.env` (git-ignored). |
| **E: Launcher** | `ORCA-LAUNCHER.md` | **MISSING on disk** | Provided via active interactive prompt context. |
| **F: Course Material & Extras** | Syllabus, rubric, guidelines, duplicate prompt folder | **PRESENT** | `Files/antigravity-prompts-v2/` (duplicate prompt files); course guidelines and PPTX in `Sustainability/`. |

### 1.2 Detailed Inventory Table

| File Name | Category | Size (Bytes) | Summary of Content | Impact on the Build |
|---|---|---|---|---|
| `00-CONTEXT-BLOCK.md` | A | 8,037 | Non-negotiable safety rules (S1–S10), working protocol (P1–P12), architecture summary, reporting format. | Supreme binding rulebook. Dictates deterministic risk engine, no stubs, evidence standards. |
| `TASK-0-stabilise-keys-providers.md` | B | 9,031 | Boot & triage, clean clone test, `check_providers`, API key verification, dev scripts. | Blueprint for Task 0. Fixes backend boot and verifies provider keys. |
| `TASK-1-ports-and-location.md` | B | 11,041 | World ports database, sea-snapping, removes Kochi defaults, geocoding. | Blueprint for Task 1. Fixes hardcoded location bug and adds `/ports/`. |
| `TASK-2-data-pipelines-risk-engine.md` | B | 11,091 | Data contracts, adapters, cited thresholds, property-based risk tests. | Blueprint for Task 2. Guarantees 100% pure deterministic risk calculation. |
| `TASK-3-chat-assistant.md` | B | 13,191 | Multi-turn chat, SSE streaming, number validator, template fallback. | Blueprint for Task 3. Resolves chat assistant connectivity and offline template mode. |
| `TASK-4-train-the-models.md` | B | 17,224 | Small advisory ML models (fishing zone, bloom, intent), gate evaluation. | Blueprint for Task 4. Advisory ML with explicit fallback and metadata. |
| `TASK-5-full-frontend.md` | B | 17,642 | Full page suite (ports, compare, how-it-works, methodology, status, etc.), wave animation, scrolling. | Blueprint for Task 5. Delivers all missing pages, design polish, and scrolling. |
| `TASK-6-offline-security-final-qa.md` | B | 12,618 | Offline PWA, canvas fish game, security hardening, final audit. | Blueprint for Task 6. Prepares production audit and course deliverables. |
| `README-HOW-TO-USE.md` | B | 2,206 | Sequence of prompt execution, rules between tasks, v1 to v2 changelog. | Workflow operational guidance. |
| `accessibility.md` | C | 6,305 | WCAG 2.1 AA standards, keyboard navigation, contrast, screen reader live regions. | Component accessible semantics and `/accessibility` page. |
| `api.md` | C | 9,794 | REST API contracts, SSE stream events, error schemas, permissions. | Backend URL routing, serializers, and frontend client generation. |
| `architecture.md` | C | 16,063 | High-level system architecture, agent orchestrator, data pipelines. | Core architectural design reference. |
| `auth.md` | C | 8,902 | Session auth, HttpOnly cookies, Turnstile bot detection, CSRF. | Auth viewsets, cookies on `.localtest.me`, auth guards. |
| `backend.md` | C | 9,536 | Backend app layers (Views -> Serializers -> Services -> Models). | Enforces clean architecture without DB queries in views. |
| `CHANGELOG.md` | C | 1,123 | Project changelog following Keep a Changelog. | Tracks progress across releases and tasks. |
| `CLAUDE.md` | C | 4,618 | Quick developer command reference and agent constraints. | Quick reference for CLI commands. |
| `contributing.md` | C | 6,158 | Branching model, Conventional Commits, code standards. | Commit formatting guidelines. |
| `database.md` | C | 8,980 | PostGIS spatial schema, GiST indexes, snapshot retention. | Spatial models, migrations, and demo data seeders. |
| `deployment.md` | C | 15,461 | Docker Compose, Cloudflare Pages/Tunnel, production topology. | Container deployment and cloud configuration. |
| `design.md` | C | 10,412 | Nautical instrument design tokens, risk color semantics, typography. | Tailwind styling and UI aesthetic tokens. |
| `frontend.md` | C | 8,973 | React + Vite architecture, TanStack Query, routing, PWA rules. | Frontend code conventions and state management. |
| `ignore.md` | C | 8,857 | Banned visual patterns, banned marketing jargon, anti-patterns. | Anti-slop quality filter. |
| `observability.md` | C | 6,818 | Structlog JSON logging, health endpoints, Sentry monitoring. | Observability and diagnostic views. |
| `performance.md` | C | 6,722 | Performance budgets: Web Vitals, bundle limits, query counts. | Performance gating and code splitting. |
| `README.md` | C | 7,641 | High-level project summary and quickstart guide. | Monorepo top-level documentation. |
| `roadmap.md` | C | 5,987 | MVP boundaries vs future v1/v2 enhancements. | Scope control. |
| `security.md` | C | 11,776 | STRIDE threat model, CSP headers, rate limits, audit logging. | Security middleware and access controls. |
| `seo.md` | C | 5,513 | OpenGraph tags, sitemap, robots.txt, prerender metadata. | Public search metadata and discovery. |
| `testing.md` | C | 7,766 | Testing strategy: 100% coverage on pure rules, Vitest, Playwright. | Quality verification standard. |
| `backend.env.keys.template` | D | 2,829 | Template of all external provider keys and configurations. | Defines key checklist without storing secrets. |
| `antigravity-prompts-v2/` | F | Directory | Duplicate prompt files from prior versioning. | Archival context only. |

---

## 2. Spec vs. Code Gap Matrix

### 2.1 Frontend Route Gap Analysis

Evaluated against `spec-docs/frontend.md` and owner-expected pages list:

| Route / Page | Expected Path | Exists in Code? | Works (Verified)? | Has Tests? | Notes / Deficiencies |
|---|---|---|---|---|---|
| **Landing Page** | `/` | Yes (`routes/landing.tsx`) | Yes | Yes | Works but single viewport layout; lacks scrolling feature sections and wave animation. |
| **Explore (Map & Chat)** | `/explore` | Yes (`routes/explore.tsx`) | Partial | Yes (MapView) | MapLibre renders; chat fails when backend is offline; hardcoded to Kochi. |
| **Ports Directory** | `/ports` | **No** | **No** | **No** | **GAP.** Expected by owner and Task 1. Needs route and search view. |
| **Port Detail Page** | `/ports/:slug` | **No** | **No** | **No** | **GAP.** Expected by owner and Task 1. |
| **Compare Ports** | `/compare` | **No** | **No** | **No** | **GAP.** Expected by owner and Task 3. |
| **How It Works** | `/how-it-works` | **No** | **No** | **No** | **GAP.** Explains multi-agent architecture and deterministic engine. |
| **Methodology** | `/methodology` | **No** | **No** | **No** | **GAP.** Documents safety thresholds, formulas, and INCOIS alignment. |
| **About Project** | `/about` | **No** | **No** | **No** | **GAP.** SDG 14 mission, Bennett University team info, academic context. |
| **System Status** | `/status` | **No** | **No** | **No** | **GAP.** Data provider freshness and uptime indicators (links to `/data-status/`). |
| **Sign In** | `/login` | Yes (`routes/login.tsx`) | Yes | Yes | Works; missing links to Privacy Policy and Terms of Service. |
| **Sign Up** | `/signup` | Yes (`routes/signup.tsx`) | Yes | Yes | Works; missing links to Terms/Privacy. |
| **Verify Email** | `/verify-email` | Yes (`routes/verify-email.tsx`) | Yes | Yes | Present in router and route file. |
| **Forgot Password** | `/forgot-password` | Yes (`routes/forgot-password.tsx`) | Yes | Yes | Present in router and route file. |
| **Reset Password** | `/reset-password` | Yes (`routes/reset-password.tsx`) | Yes | Yes | Present in router and route file. |
| **Dashboard** | `/dashboard` | Yes (`routes/dashboard.tsx`) | Yes (Auth Guard) | Yes | Protected route; shows overview cards and saved stations. |
| **Saved Locations** | `/locations` | Yes (`routes/locations.tsx`) | Yes (Auth Guard) | Yes | Protected route; CRUD for coastal stations. |
| **Advisories** | `/advisories` | Yes (`routes/advisories.tsx`) | Yes (Auth Guard) | Yes | Protected route; paginated active marine bulletins table. |
| **Alert Subscriptions** | `/alerts` | **Partial** | **No** | **No** | Managed inside locations view; no dedicated standalone route. |
| **Settings** | `/settings` | Yes (`routes/settings.tsx`) | Yes (Auth Guard) | Yes | Protected route; units toggle and account management. |
| **Privacy Policy** | `/privacy` | Yes (`routes/privacy.tsx`) | Yes | Yes | Complete legal disclosure under DPDP Act 2023 & GDPR. |
| **Terms of Service** | `/terms` | Yes (`routes/terms.tsx`) | Yes | Yes | Maritime liability disclaimer and terms of use. |
| **Accessibility Statement**| `/accessibility` | Yes (`routes/accessibility.tsx`)| Yes | Yes | WCAG 2.1 AA statement. |
| **404 Not Found** | `*` | Yes (`routes/not-found.tsx`) | Yes | Yes | Catch-all 404 chart-boundary view. |
| **Error Page** | `/error` | **Partial** | Partial | Yes | `error-boundary.tsx` exists; no explicit fallback route. |
| **Offline Page & Game** | `/offline`, `/game` | **Partial** | Partial | Yes (unit test) | `public/offline.html` exists; no SPA React routes for `/offline` or `/game`. |

### 2.2 Backend API Endpoint Gap Analysis

Evaluated against `spec-docs/api.md`:

| Endpoint | Method | Exists in Django? | Works (Verified)? | Has Tests? | Notes |
|---|---|---|---|---|---|
| `/api/v1/health/live/` | GET | Yes (`apps.core`) | Yes (manage check) | Yes (44/44) | Health probe (process live). |
| `/api/v1/health/ready/` | GET | Yes (`apps.core`) | Yes | Yes | Readiness probe (checks DB and Redis). |
| `/api/v1/data-status/` | GET | Yes (`apps.core`) | Yes | Yes | Provider status and data freshness. |
| `/api/v1/auth/csrf/` | GET | Yes (`apps.core`) | Yes | Yes | Issues CSRF token cookie. |
| `/api/v1/auth/signup/` | POST | Yes (`apps.accounts`) | Yes | Yes | User registration with Turnstile. |
| `/api/v1/auth/verify-email/`| POST | Yes (`apps.accounts`) | Yes | Yes | Token verification. |
| `/api/v1/auth/resend-verification/` | POST | Yes (`apps.accounts`) | Yes | Yes | Resends verification email. |
| `/api/v1/auth/login/` | POST | Yes (`apps.accounts`) | Yes | Yes | Session auth login. |
| `/api/v1/auth/logout/` | POST | Yes (`apps.accounts`) | Yes | Yes | Session invalidation. |
| `/api/v1/auth/me/` | GET | Yes (`apps.accounts`) | Yes | Yes | Current user profile. |
| `/api/v1/auth/password-reset/` | POST | Yes (`apps.accounts`) | Yes | Yes | Initiates reset email. |
| `/api/v1/auth/password-reset/confirm/` | POST | Yes (`apps.accounts`) | Yes | Yes | Sets new password with token. |
| `/api/v1/auth/password-change/` | POST | Yes (`apps.accounts`) | Yes | Yes | Authenticated password change. |
| `/api/v1/me/` | PATCH, DELETE | Yes (`apps.accounts`) | Yes | Yes | Profile update and account deletion. |
| `/api/v1/risk/` | GET | Yes (`apps.risk`) | Yes | Yes (100% rules cov)| Evaluates pure deterministic rules. |
| `/api/v1/chat/threads/` | GET, POST | Yes (`apps.chat`) | Yes | Yes | Thread management. |
| `/api/v1/chat/threads/{id}/` | GET, DELETE | Yes (`apps.chat`) | Yes | Yes | Thread detail. |
| `/api/v1/chat/threads/{id}/messages/` | POST | Yes (`apps.chat`) | Yes (SSE view) | Yes | Streams SSE events (`status`, `risk`, `map`, `token`, `done`). |
| `/api/v1/locations/` | GET, POST | Yes (`apps.locations`) | Yes | Yes | Saved locations CRUD. |
| `/api/v1/locations/{id}/` | GET, PATCH, DELETE | Yes (`apps.locations`) | Yes | Yes | Location detail. |
| `/api/v1/alerts/` | GET, POST | Yes (`apps.locations`) | Yes | Yes | Alert subscriptions. |
| `/api/v1/dashboard/overview/` | GET | Yes (`apps.dashboard`) | Yes | Yes | Aggregated user dashboard. |
| `/api/v1/advisories/` | GET | Yes (`apps.geodata`) | Yes | Yes | INCOIS/IMD active bulletins list. |
| `/api/v1/ports/` | GET | **No** | **No** | **No** | **GAP (Task 1).** World ports database and geocoding endpoint. |
| `/api/v1/ports/{id}/` | GET | **No** | **No** | **No** | **GAP (Task 1).** Port detail with sea-snap coordinates. |
| `/api/v1/schema/` | GET | Yes (`drf-spectacular`)| Yes | Yes | OpenAPI 3.0 schema generation. |
| `/api/v1/docs/` | GET | Yes (`drf-spectacular`)| Yes | Yes | Swagger UI documentation. |

---

## 3. Known Failures Root Cause Analysis

Every failure reported by the owner has been investigated directly in the source code:

| # | Known Failure | Root Cause in Code | File & Line Reference |
|---|---|---|---|
| **1** | **Only 3 pages exist (landing, map, login)** | The landing navigation header only renders links to `/explore`, `/login`, and `/signup`. Routes for `/ports`, `/compare`, `/how-it-works`, `/methodology`, `/about`, and `/status` were never registered in `router.tsx` or built into the UI shell. | `frontend/src/routes/landing.tsx`: L17–L27<br>`frontend/src/app/router.tsx`: L20–L74 |
| **2** | **Location hardcoded to Kochi** | 1. In `llm.py`, when a user query does not match a port and lacks coordinates, the function unconditionally defaults to Kochi (9.97, 76.24).<br>2. In `ExplorePage.tsx`, state is initialized with `{ lat: 9.97, lon: 76.24 }`.<br>3. In `MapView.tsx`, the fallback default prop is hardcoded to Kochi with no dynamic port URL syncing. | `backend/apps/agents/llm.py`: L87–L93<br>`frontend/src/routes/explore.tsx`: L10<br>`frontend/src/features/map/MapView.tsx`: L16 |
| **3** | **Chat assistant not working** | 1. The backend server on port 8000 was offline (`ECONNREFUSED`), causing initial thread creation (`POST /api/v1/chat/threads/`) to throw.<br>2. When `threadId` is null, `useChatStream.ts` silently exits on line 59 without any retry or visual warning.<br>3. No local offline mock thread or guest session fallback exists. | `frontend/src/routes/explore.tsx`: L19–L25<br>`frontend/src/features/chat/useChatStream.ts`: L59 |
| **4** | **Backend not working** | Docker Compose services (PostGIS DB, Redis, Celery) were not started; `.env` was missing until initialized; host GDAL/PostGIS libraries require containerised orchestration or native SQLite fallback. | `backend/config/settings/base.py`: L33–L48<br>`infra/docker-compose.yml`: L1–L80 |
| **5** | **No 404, error, offline or game pages** | Standalone `offline.html` with canvas game was placed in `public/` but has no React route (`/offline` or `/game`). Catch-all 404 was absent until recently added. No `/error` route exists. | `frontend/src/app/router.tsx`: L20–L74<br>`frontend/public/offline.html`: L1–L120 |
| **6** | **No wave animation anywhere** | Neither `tokens.css`, `globals.css`, nor `tailwind.config.ts` defines `@keyframes wave` or SVG sine-wave decorative animations. The hero displays a static badge. | `frontend/src/styles/globals.css`: L1–L50<br>`frontend/src/styles/tokens.css`: L1–L95 |
| **7** | **No Terms or Privacy linked from login** | In `login.tsx` and `signup.tsx`, the footer links only to the opposite auth screen. No links to `/privacy` or `/terms` exist on either page. | `frontend/src/routes/login.tsx`: L110–L116<br>`frontend/src/routes/signup.tsx`: L103–L109 |
| **8** | **Pages do not scroll (landing not a real page)** | The landing page root container uses `min-h-screen flex flex-col justify-between` with only a single hero block and footer. There are no content sections (SDG 14 features, ports directory preview, technology breakdown, testimonials), causing it to fit entirely in one non-scrolling viewport. | `frontend/src/routes/landing.tsx`: L9, L31–L100 |

---

## 4. Keys and Data Providers Status Report

Evaluated strictly by checking `backend/.env` and `frontend/.env` against `backend.env.keys.template`. **Zero secret values are logged or displayed.**

| Variable Name | Status | Category / Provider | Required / Notes |
|---|---|---|---|
| `GFW_API_ACCESS_TOKEN` | **missing** | Global Fishing Watch (v3) | Recommended (needed for ML training Task 4) |
| `COPERNICUSMARINE_USERNAME` | **missing** | Copernicus Marine Service | Recommended (ocean currents & chlorophyll) |
| `COPERNICUSMARINE_PASSWORD` | **missing** | Copernicus Marine Service | Recommended |
| `LLM_PROVIDER` | **set** (`template`) | LLM Engine | Safe deterministic template fallback mode |
| `GEMINI_API_KEY` | **missing** | Google AI Studio | Optional (template mode operates without key) |
| `GEMINI_MODEL` | **missing** | Google Gemini | Optional |
| `ANTHROPIC_API_KEY` | **missing** | Anthropic Claude | Optional |
| `ANTHROPIC_MODEL` | **missing** | Anthropic Claude | Optional |
| `LLM_DAILY_TOKEN_BUDGET` | **set** (`200000`) | Cost Control | Enforces daily spend limits |
| `CDS_API_URL` | **missing** | ECMWF Climate Data Store | Optional (ERA5 reanalysis) |
| `CDS_API_KEY` | **missing** | ECMWF Climate Data Store | Optional |
| `OPEN_METEO_API_KEY` | **missing** | Open-Meteo Marine | Optional (free tier requires no key) |
| `SENTRY_DSN` | **missing** | Observability | Optional |
| `TURNSTILE_SECRET_KEY` | **missing** | Cloudflare Turnstile | Local dev bypasses active; production needs key |
| `CF_ACCESS_TEAM_DOMAIN` | **missing** | Cloudflare Access | Deployment only |
| `CF_ACCESS_AUD` | **missing** | Cloudflare Access | Deployment only |
| `CLOUDFLARED_TUNNEL_TOKEN`| **missing** | Cloudflare Tunnel | Deployment only |
| `R2_ENDPOINT_URL` | **missing** | Cloudflare R2 | Deployment only |
| `R2_ACCESS_KEY_ID` | **missing** | Cloudflare R2 | Deployment only |
| `R2_SECRET_ACCESS_KEY` | **missing** | Cloudflare R2 | Deployment only |
| `EMAIL_HOST` | **missing** | SMTP Email | Dev uses console email backend |
| `EMAIL_PORT` | **missing** | SMTP Email | Dev uses console email backend |
| `EMAIL_HOST_USER` | **missing** | SMTP Email | Dev uses console email backend |
| `EMAIL_HOST_PASSWORD` | **missing** | SMTP Email | Dev uses console email backend |
| `DEFAULT_FROM_EMAIL` | **missing** | SMTP Email | Dev uses console email backend |
| `VITE_MAPTILER_KEY` | **missing** | MapTiler Vector Basemap | Uses free OpenStreetMap / PMTiles fallback |

- **`.gitignore` status:** Verified. `.env`, `.env.*`, and `*.key` are strictly ignored on line 2 of `.gitignore`.
- **Operating Mode:** The system is configured for full **Keyless / Offline Template Mode**. Open-Meteo, NOAA ERDDAP, GDACS, and OpenStreetMap operate without keys, and LLM text generation operates safely in template mode.

---

## 5. Course Requirements Checklist (Bennett University)

Extracted from `Technology and Sustainability Mini Project Guidelines.pdf` and course syllabus for **2026CSAE102**:

- **Course:** 2026CSAE102 — Technology and Sustainability (Semester I, B.Tech)
- **Challenge:** Sustainable Technology Startup Challenge (Total: 30 Marks)
- **SDG Mapping:** SDG 14: Life Below Water (Target 14.1, 14.2, 14.7, 14.b)

### 5.1 Deliverables Checklist

- [x] **Milestone 1 Deliverables (8 Marks — 2 Oct 2026)**
  - [x] Problem identification & context (marine coastal safety & overfishing)
  - [x] Target users & stakeholders (artisanal fishers, coastal trawlers, port authorities)
  - [x] Technology & SDG mapping (deterministic AI/ML, GIS remote sensing, SDG 14)
  - [x] Existing solution gap analysis (scattered portals vs unified low-bandwidth reasoning)
  - [x] Industry & faculty discussion logs
- [ ] **Milestone 2 Deliverables (12 Marks — 2 Nov 2026)**
  - [x] Detailed architecture, data flow, and UML diagrams (`docs/architecture.md`)
  - [x] Running prototype / working implementation (Django API + Vite React UI)
  - [ ] Demonstration of modules with multi-port queries and snapping (Target: Task 1)
  - [x] Active Git repository with progress history (`Abhilakkkkshya505/orca_project`)
  - [x] Business Model Canvas (BMC) & Technical Synopsis (`deliverables/bmc.md`)
  - [ ] 90–150 second progress demonstration video / screen recording (Target: Task 6)
- [ ] **Milestone 3 Deliverables (10 Marks — 1 Dec 2026)**
  - [x] Prescribed 9-Chapter Final Project Report (`deliverables/report.md` formatted to rubric)
  - [x] Final Presentation Slides (`deliverables/presentation.md`)
  - [ ] Team presentation & viva preparation materials
  - [x] LinkedIn public blog post copy (`deliverables/linkedin-post.md`)
  - [ ] 3–5 minute comprehensive YouTube project journey & demo script (`deliverables/demo-script.md`)

---

## 6. Risks and Unknowns

1. **Docker Desktop Engine Availability on Host:** Docker Desktop daemon was not actively responding (`pipe/dockerDesktopLinuxEngine` error). Docker Compose containers cannot boot until Docker Desktop is launched.
2. **Missing External API Keys (GFW, Copernicus):** Without GFW and Copernicus keys, real-time vessel density overlays and deep satellite ingestion require synthetic/demo fallbacks.
3. **Database Migration Dependency on PostGIS:** GeoDjango models require PostGIS spatial extensions. Local host execution without Docker requires GDAL/GEOS libraries or spatial mock settings for test execution.
4. **Coordinate Snapping & Inland Traps:** Sea queries for ports located in shallow bays or rivers (e.g. inland docks) return empty Open-Meteo marine cells unless snapped to the nearest offshore nautical coordinate (Target: Task 1).
5. **LLM Number Hallucination Safeguard:** External LLMs frequently hallucinate wave heights or wind speeds. Rule S4 mandates that `validators.py` rejects any generated text with unregistered numbers, falling back to deterministic templates.
