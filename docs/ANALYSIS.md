# Analysis of Project Inputs, Technical Documentation, and Course Requirements

**Project:** ORCA (Marine Ecosystem Reasoning with Collaborative AI Agents)  
**Target Output Location:** `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\orca`  
**Input Location:** `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\Files`  
**Date of Analysis:** 18 October 2026  

---

## 1. Input Folder File Inventory

Every file located in `C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability\Project\Files` was recursively inspected and read in its entirety. All 20 files are Markdown documents.

| File Name | File Type | Size (Bytes) | Summary of Content | Impact on the Build |
|---|---|---|---|---|
| `accessibility.md` | Markdown (`.md`) | 6,305 | WCAG 2.2 AA standards, keyboard navigation, contrast thresholds (4.5:1 text, 3:1 UI), live regions for chat streaming, text alternatives for map, touch target sizes (min 44x44px). | Governs frontend component design, ARIA labels, focus states, keyboard handlers, and accessibility compliance page `/accessibility`. |
| `api.md` | Markdown (`.md`) | 9,794 | Complete OpenAPI / REST specification for `/api/v1/`, error response structure, health checks, auth endpoints, chat SSE streaming events (`status`, `risk`, `map`, `token`, `done`, `error`), locations CRUD, alert subscriptions, and permissions matrix. | Establishes the exact backend URL routing, DRF serializers, viewsets, query parameters, error format, and frontend API client generation contracts. |
| `architecture.md` | Markdown (`.md`) | 16,063 | High-level system architecture, data flow diagrams, technology stack rationale, data sources (Open-Meteo, Copernicus, NASA, INCOIS), data models (User, GridCell, ForecastSnapshot, Advisory, RiskAssessment, FishingZone, Thread, Message, SavedLocation, AlertSubscription), deterministic rules engine design, agents, and caching. | Core architectural blueprint. Defines Django app boundaries (`core`, `accounts`, `geodata`, `risk`, `agents`, `chat`, `locations`, `dashboard`, `auditlog`), agent signatures, and strict separation between rules engine and LLM. |
| `auth.md` | Markdown (`.md`) | 8,902 | Authentication decision: Django session auth with HttpOnly cookies across shared parent domain (`.localtest.me` in dev, `.orca.example` in prod); Cloudflare Turnstile integration (server-side verification with fail-closed policy); CSRF tokens; signup with anti-enumeration; password reset; guest sessions. | Dictates Django auth settings, `CustomUser` model, Turnstile verification service, DRF throttles, cookie domains, and frontend auth state management via TanStack Query. |
| `backend.md` | Markdown (`.md`) | 9,536 | Backend coding standards: settings split (`base`, `dev`, `prod`, `test`), app layering (Views -> Serializers -> Services -> Models), base models (`TimeStampedModel`, `PublicIdModel`), Celery tasks & beat schedules, idempotency rules, SSE async streaming view. | Enforces strict architectural layers, prohibiting business logic in views or serializers, banning N+1 queries, and mandating service-layer orchestration. |
| `CHANGELOG.md` | Markdown (`.md`) | 1,123 | Changelog adhering to Keep a Changelog and SemVer. Documents initial unreleased architecture and decision records. | Must be maintained and updated with every user-visible change throughout all project phases. |
| `CLAUDE.md` | Markdown (`.md`) | 4,618 | Developer cheat sheet and hard constraints for AI coding agents: deterministic rules engine, no external calls in request cycle, validation of LLM output numbers, conventional commits, command references. | Direct behavioral guide and quick command reference for the build process. |
| `contributing.md` | Markdown (`.md`) | 6,158 | Contribution guidelines, Git branch and Conventional Commit conventions (`type(scope): summary`), code review checklist, dependency vetting, release procedures. | Determines Git commit messages for each phase and local verification standards. |
| `database.md` | Markdown (`.md`) | 8,980 | PostgreSQL + PostGIS schema, indexes, GiST spatial indexing, constraints, migrations expand-and-contract policy, data retention (14-day snapshot pruning), synthetic data flagging, backup/restore procedures. | Defines database migrations, models, GiST spatial lookups, PostGIS KNN spatial distance queries, indexing strategy, and `seed_demo_data` command. |
| `deployment.md` | Markdown (`.md`) | 15,461 | Infrastructure topologies: Cloudflare Pages (frontend SPA) and Docker Compose on an India-region VPS via Cloudflare Tunnel; zero-downtime migrations; environment variables reference; Dockerfile specifications. | Guides `infra/docker-compose.yml`, `infra/docker-compose.prod.yml`, backend `Dockerfile`, deployment shell scripts, and GitHub Actions CI/CD workflows. |
| `design.md` | Markdown (`.md`) | 10,412 | Nautical chart instrument aesthetic: semantic color tokens (light & dark modes), risk status tokens (`safe`, `caution`, `unsafe`, `unknown`), IBM Plex Sans and IBM Plex Mono typography, spacing, radii, shadows, motion, component rules. | Drives `frontend/src/styles/tokens.css`, `tailwind.config.ts`, custom SVG risk badges, and all visual styling. Prohibits generic SaaS gradients, glassmorphism, or non-token colors. |
| `frontend.md` | Markdown (`.md`) | 8,973 | Frontend architecture: Vite + React SPA + TypeScript (strict mode), React Router with lazy loading, TanStack Query, react-hook-form + Zod schemas, MapLibre GL JS with PMTiles protocol, custom service worker PWA, standalone offline page + HTML5 canvas fish game. | Dictates frontend package selection, directory layout, route definitions, API client implementation, SSE consumer hook, and PWA service worker. |
| `ignore.md` | Markdown (`.md`) | 8,857 | Anti-AI-slop rulebook: explicit list of banned visual patterns (no gradients, no glassmorphism, no emoji bullets, no generic 3-card grids), banned marketing buzzwords, banned frontend/backend anti-patterns, pre-merge checklist. | Mandatory filter applied to all code, UI components, copy, commit messages, and documentation. Non-negotiable quality and safety boundary. |
| `observability.md` | Markdown (`.md`) | 6,818 | Structured JSON logging with `structlog`, request ID tracking (`CF-Ray` or ULID), Sentry error monitoring with PII scrubbing, `/api/v1/health/live/`, `/api/v1/health/ready/`, `/api/v1/data-status/`, metrics, degraded-mode behaviors. | Informs middleware design, health check endpoints, exception logging, and audit trail generation for risk assessments. |
| `performance.md` | Markdown (`.md`) | 6,722 | Performance budgets: Web Vitals (LCP <= 2.5s, INP <= 200ms, CLS <= 0.1), bundle size limits (landing <= 120KB, app shell <= 180KB, map chunk <= 330KB gzip), API latency percentiles, database query caps (max 8 queries per list endpoint). | Sets architectural constraints for lazy loading, query optimisation (`select_related`, `prefetch_related`), font preloading, and caching. |
| `README.md` | Markdown (`.md`) | 7,641 | High-level project overview, mission statement (UN SDG 14: Life Below Water), target users (fishermen, coastal authorities, researchers, citizens), quickstart instructions, monorepo directory tree, environment variable references. | Master overview of the project; provides structure for top-level repo documentation. |
| `roadmap.md` | Markdown (`.md`) | 5,987 | Scope definition: MVP in-scope vs. out-of-scope, pilot validation criteria, future v1 milestones (phone OTP, regional languages, voice, raster layers). | Clarifies feature boundaries for the current build to prevent scope creep. |
| `security.md` | Markdown (`.md`) | 11,776 | Threat model (STRIDE), session security, CSRF protection, strict CORS, CSP headers (`_headers`), trusted proxy handling (`CF-Connecting-IP`), Cloudflare Access JWT validation for `/admin/`, input limits, account deletion, privacy safeguards. | Informs security middleware (`core/cloudflare.py`), admin security, auth endpoints, rate limits, CSP headers, and data protection practices. |
| `seo.md` | Markdown (`.md`) | 5,513 | SEO strategy for public routes: static prerendering for `/`, `/privacy`, `/terms`, `/accessibility`, metadata, Open Graph cards, `robots.txt`, `sitemap.xml`, `X-Robots-Tag: noindex` for auth and API routes. | Dictates public metadata, SEO header generation, sitemap scripts, and robots configuration. |
| `testing.md` | Markdown (`.md`) | 7,766 | Testing strategy: pytest, factory_boy, 100% branch coverage on `apps/risk/rules.py` and `apps/agents/validators.py`, endpoint permission matrix testing, query-count tests, Vitest component tests, Playwright end-to-end flows. | Governs test directory layout, test factories, unit/integration suites, and CI quality gates. |

---

## 2. Course and Academic Material Analysis

In the course folder (`C:\Users\thetu\Documents\Bennett Study\SEM 1\Sustainability`), the academic curriculum documents were discovered and analysed:
- `Technology and Sustainability Mini Project Guidelines.pdf`
- `2026CSAE102-Technology-and-Sustainability-BTLAP-2026_230826 Final.pdf`

### 2.1 Course Identification
- **Institution:** Bennett University
- **Course Code & Title:** 2026CSAE102 — Technology and Sustainability
- **Target Level:** B.Tech I Year, Semester I (All Disciplines, Multidisciplinary Course - MDC)
- **Course Coordinators:** Dr. Indrajeet Gupta, Dr. Saurabh Mittal
- **Project Component:** Sustainable Technology Startup Challenge (Mini-Project)
- **Total Marks:** 30 Marks (CA:ESE = 60:40)
- **Team Size:** 3–5 students

### 2.2 Prescribed Milestones & Assessment Breakdown

| Milestone | Deadline | Marks | Required Deliverables & Evidence |
|---|---|---|---|
| **Milestone 1: Problem Identification & Proposal** | 2 October 2026 | **8 Marks** | • Project Title (1.0)<br>• Project Description (1.0)<br>• Problem / Sustainability Challenge (1.0)<br>• Reason for Project Selection (0.5)<br>• Target Users / Stakeholders (0.5)<br>• Sustainability / SDG Mapping (1.0)<br>• Technology / Data Approach (0.5)<br>• Existing Solutions / Gap Analysis (1.0)<br>• Research / Evidence (1.0)<br>• Industry / Working Professional Feedback (0.5)<br>• Faculty / Senior Student Feedback (0.5) |
| **Milestone 2: Design, Development & Demonstration** | 2 November 2026 | **12 Marks** | • Project Design Description and Diagrams (2.0)<br>• Running / Partial Build / Implementation (3.0)<br>• Demonstration / Pilot Run / Live Deployment (2.0)<br>• Updated Project Git Repository / Source Files Folder (2.0)<br>• BMC / Patent / Research Paper / Technical Synopsis (1.0)<br>• 90–150 Second Short Video / Reel (2.0) |
| **Milestone 3: Final Project, Documentation & Presentation** | 1 December 2026 | **10 Marks** | • Prescribed Final Project Report (2.0)<br>• Organization & Structure of Project Report (1.0)<br>• Presentation PPT/PDF/Creatives (1.0)<br>• Team Presentation Viva-Voce / Individual Contribution (2.0)<br>• LinkedIn Blog Post (2.0)<br>• YouTube Video / Reel (3–5 Minutes) with demonstration (2.0) |

### 2.3 Official 30-Mark Assessment Rubric (Appendix I)

| Criterion | Sub-Criterion | Marks |
|---|---|---|
| **1. Problem Analysis (6 Marks)** | Problem-domain identification and analysis | 3.0 |
| | Review of existing systems and project feasibility | 3.0 |
| **2. Project Design (6 Marks)** | Objectives and methodology of the proposed work | 3.0 |
| | Relevance of algorithms/techniques (technology selection) | 3.0 |
| **3. Project Implementation (6 Marks)** | Synchronisation of project design & implementation | 3.0 |
| | Implementation & demonstration of modules (prototype/MVP) | 3.0 |
| **4. Project Report (6 Marks)** | Organisation and structure of project report | 3.0 |
| | Compliance with prescribed report format | 3.0 |
| **5. Communication (6 Marks)** | Clarity and organisation of presentation (pitch/demo) | 3.0 |
| | Contribution by each team member | 3.0 |
| **Total Assessment** | | **30.0** |

### 2.4 Prescribed Final Project Report Structure (9 Chapters)
1. **Front Matter:** Title page, Team details, Declaration/Certificate, Acknowledgement, Abstract/Executive Summary, Table of Contents.
2. **Chapter 1 — Introduction:** Background, context, motivation, and project objectives.
3. **Chapter 2 — Literature / Existing Work:** Prior art, existing marine portals (INCOIS, IMD, Windy), gap analysis.
4. **Chapter 3 — Problem & Requirement Analysis:** Stakeholder needs, requirements, operational constraints, empirical evidence.
5. **Chapter 4 — Proposed Solution & Design:** Architecture, multi-agent reasoning, deterministic rules engine, system workflows, database design.
6. **Chapter 5 — Implementation:** Tech stack (Django, PostGIS, React, MapLibre), data ingestion adapters, LLM validators, SSE streaming.
7. **Chapter 6 — Testing & Demonstration:** Test strategy, coverage metrics, boundary value tests, permission tests, offline PWA evaluation.
8. **Chapter 7 — Results & Discussion:** Operational results, accuracy, latency, limitations, and objective validation.
9. **Chapter 8 — Sustainability / Business / Research Contribution:** SDG 14 targets (14.1, 14.2, 14.b), Business Model Canvas (BMC), economic viability for coastal communities.
10. **Chapter 9 — Conclusion & Future Scope:** Summary of outcomes, roadmap (voice, regional languages, mobile app).
11. **References:** Academic and technical bibliography in consistent format.
12. **Appendices:** Schemas, interview records, screenshots, and setup walkthroughs.

---

## 3. Conflict Analysis & Resolution

| Conflict | Source A | Source B | Resolution & Rationale |
|---|---|---|---|
| **Frontend Framework** | System prompt allows Next.js or Vite | User prompt & `Files/frontend.md` explicitly mandate **Vite + React SPA** | **Vite + React SPA.** User prompt and technical docs specifically mandate a client-side SPA with PWA and MapLibre GL, without Next.js server duplication. |
| **CSS System** | System prompt general guideline mentions Vanilla CSS | User prompt & `Files/design.md` mandate **Tailwind CSS mapped to CSS custom properties** | **Tailwind CSS with CSS custom properties.** Technical docs dictate strict token mapping without raw hex codes. |
| **Deliverables Scope** | Technical docs focus solely on production software | Course guidelines mandate Academic Report (9 chapters), Presentation, BMC, LinkedIn Post, and Video Scripts | **Both are built.** Following the Conflict Rule: Course requirements win on *what must be delivered* (full academic documentation and artefacts in `deliverables/`), and technical docs win on *how it is built* (production-grade software). |
| **Risk Decision Authority** | Modern AI applications often let LLM classify risk | `Files/architecture.md` and `Files/ignore.md` rule: LLM must NEVER decide risk | **Deterministic Rules Engine (`apps/risk/rules.py`).** The LLM is strictly confined to intent routing and explanatory prose generation, with a strict numeric validator rejecting hallucinations. |
| **Data Freshness Fallback** | Traditional apps often return cached or synthetic data silently | `Files/architecture.md` and `Files/ignore.md` rule: Missing or stale data MUST evaluate to `unknown` | **Deterministic `unknown` level.** Safety-critical rule: Missing or expired data never defaults to `safe`. |

---

## 4. Identified Gaps & Build Strategy

1. **Local Hostname Mapping:** The app relies on `app.localtest.me:5173` and `api.localtest.me:8000` to share session cookies across subdomains. Windows local DNS resolves `*.localtest.me` to `127.0.0.1` natively without modifying `C:\Windows\System32\drivers\etc\hosts`.
2. **PostGIS Environment on Windows:** To guarantee GDAL, GEOS, and PROJ library availability for GeoDjango without local Windows C++ driver conflicts, the backend runs in Docker or utilizes tested containerised dependencies. Docker Desktop is present on the machine.
3. **Turnstile Development Mode:** Local development uses Cloudflare's published testing dummy site key (`1x00000000000000000000AA`) and secret key (`1x0000000000000000000000000000000AA`), which always pass validation.
4. **Offline Map Data:** Self-hosted PMTiles for the Indian coastline are stubbed with sample vector GeoJSON layers and fallback raster tiles so that maps operate smoothly in local offline environments.
5. **Pluggable LLM Provider:** Because external paid API keys must not be hardcoded or required to run the test suite, `LLM_PROVIDER=template` is provided as the default zero-cost, offline-capable implementation, alongside `gemini` and `anthropic` drivers.
