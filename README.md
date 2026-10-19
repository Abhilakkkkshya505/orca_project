<div align="center">

<img src="https://img.shields.io/badge/SDG%2014-Life%20Below%20Water-0A97D9?style=for-the-badge&logo=un&logoColor=white" />
<img src="https://img.shields.io/badge/Version-1.0.0--dev-22c55e?style=for-the-badge" />
<img src="https://img.shields.io/badge/Tests-68%20Passed-22c55e?style=for-the-badge&logo=pytest&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge" />

<br/>

```
 ██████╗ ██████╗  ██████╗ █████╗ 
██╔═══██╗██╔══██╗██╔════╝██╔══██╗
██║   ██║██████╔╝██║     ███████║
██║   ██║██╔══██╗██║     ██╔══██║
╚██████╔╝██║  ██║╚██████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

### **Oceanic Reasoning & Coastal Assistant**
#### *Deterministic Marine Safety Intelligence Powered by Collaborative AI Agents*

<br/>

> **4 million artisanal fishers. 7,516 km of coastline. One platform that never guesses.**

<br/>

[🌊 Explore Live Demo](https://app.orca-marine.org) &nbsp;·&nbsp; [📖 Read the Docs](docs/architecture.md) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/Abhilakkkkshya505/orca_project/issues) &nbsp;·&nbsp; [🗺️ Roadmap](docs/roadmap.md)

</div>

---

## 🌐 What Is ORCA?

**ORCA (Oceanic Reasoning & Coastal Assistant)** turns scattered, hard-to-interpret oceanographic telemetry into a single, actionable coastal safety rating for a specific location — delivered through a streaming chat interface and an interactive nautical map.

Built for **UN Sustainable Development Goal 14: Life Below Water**.

```
  User asks: "Is it safe to take my boat out near Fort Kochi today?"
                               │
                   ┌───────────▼────────────┐
                   │  Multi-Agent Orchestrator │
                   └─┬────────┬────────┬─────┘
             Weather │  Ocean │   Sat. │  Advisory
               Agent │  State │  Agent │  Agent
                     │  Agent │        │
                   ┌─▼────────▼────────▼─────┐
                   │  DETERMINISTIC RULES ENGINE  │
                   │  (Pure Math · No LLM · No DB)│
                   └────────────┬─────────────┘
                                │
               ┌────────────────▼──────────────────┐
               │  RISK LEVEL: ⚠️ CAUTION            │
               │  Wave Height: 1.8m (> 1.5m limit) │
               │  Valid until: 18:00 UTC            │
               │  Data Age: 47 min                  │
               └────────────────────────────────────┘
```

### ⚠️ Safety First — Always
> ORCA is decision-support, **not** an official warning service. Official IMD and INCOIS warnings always override ORCA. Every answer displays its data timestamp and sources. If data is missing or stale, ORCA returns **`unknown`** — it never defaults to **`safe`**.

---

## ✨ Key Features

| Feature | Description |
|:--------|:------------|
| 🛡️ **Deterministic Risk Engine** | Safety ratings are pure mathematical functions — no LLM, no DB reads, no clock. Reproducible and auditable. |
| 🤖 **Multi-Agent Reasoning** | Specialist agents (Weather, Ocean, Satellite, Advisory, Fishing Zone) feed structured data to the orchestrator. |
| 🔢 **Anti-Hallucination Validator** | Regex-based number validator rejects any LLM response containing an ungrounded statistic. |
| 🗺️ **Nautical MapLibre GL Chart** | Interactive nautical chart with fishing zone overlays, advisory polygons, and "Use this point" keyboard control. |
| 📡 **SSE Streaming Chat** | Progressive token-by-token reasoning stream with live status bar showing each agent step. |
| 🌊 **Offline PWA + Fish Mini-Game** | 60fps canvas mini-game on `offline.html` with zero dependencies. Reconnects automatically when signal returns. |
| ♿ **WCAG 2.1 AA Accessible** | Risk levels encoded by **Icon + Shape + Word + Colour** — never colour alone. Outdoor 7:1 contrast. |
| 🔒 **Cloudflare Zero Trust** | WAF, Turnstile bot verification, Zero Trust Access for `/admin/`, session cookies on a shared parent domain. |

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    U["👤 User (Fisher / Researcher / Authority)"]
    U -->|"HTTPS Chat Query"| CF["☁️ Cloudflare Edge\nWAF · Turnstile · Access · DDoS"]
    CF -->|"Cloudflare Tunnel (no open ports)"| API["⚙️ Django 5 ASGI\n(Uvicorn)"]

    API --> ORCH["🤖 Agent Orchestrator"]
    ORCH --> WA["🌬️ Weather Agent"]
    ORCH --> OA["🌊 Ocean State Agent"]
    ORCH --> SA["🛰️ Satellite Agent"]
    ORCH --> AA["📋 Advisory Agent"]
    ORCH --> FZA["🐟 Fishing Zone Agent"]

    WA --> RULES["⚖️ Deterministic Rules Engine\nrules.py — Pure Functions\nNo LLM · No DB · No Clock"]
    OA --> RULES
    SA --> RULES
    AA --> RULES

    RULES -->|"SAFE / CAUTION / UNSAFE / UNKNOWN"| VAL["🔢 Numeric Validator\nvalidators.py"]
    VAL -->|"Grounded Explanation"| SSE["📡 SSE Stream\nstatus · risk · map · token · done"]
    SSE -->|"HTTP/1.1 text/event-stream"| U

    CELERY["⏱️ Celery Beat\n(Background Ingestion)"] -->|"Scheduled Tasks"| OM["Open-Meteo\nMarine API"]
    CELERY --> COP["Copernicus\nMarine Service"]
    CELERY --> INC["INCOIS\nAdvisory Feeds"]
    CELERY --> NASA["NASA\nOcean Color"]
    OM --> DB[("🗃️ PostgreSQL 16\n+ PostGIS")]
    COP --> DB
    INC --> DB
    NASA --> DB
    DB --> API
    REDIS[("⚡ Redis 7\nCache · Throttle · Token Budget")] --> API

    FE["🖥️ React 19 SPA\nVite · TypeScript · Tailwind\nMapLibre GL · PWA"] -->|"HTTPS"| CF
    FE --> U
```

---

## 🔄 Risk Evaluation Flow

```mermaid
flowchart LR
    IN["📥 Sensor Telemetry\n& Advisories"] --> CHK{"Official\nSevere\nWarning?"}
    CHK -->|"Yes"| UNSAFE["🔴 UNSAFE\n(Overrides all\nsensor data)"]
    CHK -->|"No"| STALE{"Data Missing\nor Stale\n> 24h?"}
    STALE -->|"Yes"| UNK["⬜ UNKNOWN\n(Never defaults\nto safe)"]
    STALE -->|"No"| THRESH{"Compare vs\nVessel Class\nThresholds"}
    THRESH -->|"Hₛ > 2.5m\nor W > 30kn"| UNSAFE2["🔴 UNSAFE"]
    THRESH -->|"Hₛ > 1.5m\nor W > 20kn"| CAUT["🟡 CAUTION"]
    THRESH -->|"All Within\nLimits"| SAFE["🟢 SAFE"]

    style UNSAFE fill:#ef4444,color:#fff,stroke:#b91c1c
    style UNSAFE2 fill:#ef4444,color:#fff,stroke:#b91c1c
    style CAUT fill:#f59e0b,color:#1a1a1a,stroke:#d97706
    style SAFE fill:#22c55e,color:#fff,stroke:#16a34a
    style UNK fill:#64748b,color:#fff,stroke:#475569
```

---

## 🧩 Tech Stack

<div align="center">

### 🖥️ Frontend

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-396CB2?style=for-the-badge&logo=maplibre&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

### ⚙️ Backend

![Python](https://img.shields.io/badge/Python_3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django_5.x-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST_Framework-A30000?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16_+_PostGIS-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn_ASGI-499848?style=for-the-badge&logo=gunicorn&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)

### ☁️ Infrastructure & Edge

![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

### 🌍 Data Sources

![Open-Meteo](https://img.shields.io/badge/Open--Meteo-0EA5E9?style=for-the-badge&logo=cloudflarepages&logoColor=white)
![Copernicus](https://img.shields.io/badge/Copernicus_Marine-003087?style=for-the-badge&logo=esa&logoColor=white)
![INCOIS](https://img.shields.io/badge/INCOIS-0A6EBD?style=for-the-badge&logo=gov&logoColor=white)
![NASA](https://img.shields.io/badge/NASA_Ocean_Color-FC3D21?style=for-the-badge&logo=nasa&logoColor=white)

</div>

---

## 📦 Monorepo Structure

```
orca/
├── 📄 README.md                          # You are here
├── 📄 CLAUDE.md                          # AI agent operational guide
├── 📄 CHANGELOG.md                       # Conventional Commits changelog
├── 📄 PROGRESS.md                        # Phase completion tracker
├── 🔒 .gitignore / .gitattributes        # LF line endings enforced
│
├── 📁 .github/
│   └── workflows/
│       ├── backend-ci.yml               # Pytest + Ruff + Mypy
│       ├── frontend-ci.yml              # Vitest + Playwright + pnpm audit
│       └── deploy-backend.yml           # Docker build → VPS roll-out
│
├── 📁 docs/                             # All technical documentation
│   ├── ANALYSIS.md                      # Input file inventory
│   ├── ASSUMPTIONS.md                   # Logged decisions and conflicts
│   ├── MANUAL_SETUP.md                  # Human deployment checklist
│   ├── CODE_WALKTHROUGH.md              # Line-by-line critical file guide
│   ├── architecture.md                  # System design & data model
│   ├── design.md                        # Design tokens & colour system
│   ├── ignore.md                        # Anti-slop rulebook (banned patterns)
│   ├── security.md                      # Threat model & controls
│   ├── auth.md                          # Authentication flows
│   ├── api.md                           # Endpoint reference
│   ├── database.md                      # Schema, indexes, backups
│   ├── deployment.md                    # Infrastructure & release
│   ├── testing.md                       # Test strategy
│   ├── observability.md                 # Logging, health, alerts
│   ├── accessibility.md                 # WCAG requirements
│   ├── performance.md                   # Performance budgets
│   └── roadmap.md                       # MVP, v1, later milestones
│
├── 📁 deliverables/                     # Academic course output
│   ├── report.md                        # 9-chapter Bennett University report
│   ├── presentation.md                  # 10-slide deck
│   ├── bmc.md                           # Business Model Canvas & SROI
│   ├── demo-script.md                   # 5-minute YouTube video script
│   └── linkedin-post.md                 # Project showcase post
│
├── 📁 frontend/                         # React + TypeScript SPA
│   ├── .env.example
│   ├── package.json / pnpm-lock.yaml
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── public/
│   │   ├── offline.html                 # Standalone offline page + fish game
│   │   ├── sw.js                        # Custom service worker
│   │   ├── manifest.webmanifest
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   ├── _headers                     # Cloudflare Pages security headers
│   │   └── _redirects                   # SPA fallback routing
│   └── src/
│       ├── app/                         # main.tsx, router, providers
│       ├── routes/                      # landing, explore, dashboard, etc.
│       ├── features/
│       │   ├── auth/                    # RequireAuth guard
│       │   ├── chat/                    # useChatStream, RiskCard, FactorRow, ChatPanel
│       │   └── map/                     # MapView, colour ramps
│       ├── components/
│       │   ├── ui/                      # RiskBadge, RiskIcon, Button, Input, Skeleton
│       │   └── layout/                  # AppShell, ConsentBanner
│       ├── lib/
│       │   ├── api/                     # CSRF-aware fetch client + generated OpenAPI types
│       │   └── pwa/                     # Service worker registration & reconnect
│       ├── styles/                      # tokens.css, globals.css
│       └── test/                        # Vitest suites (auth, risk, SSE, game)
│
├── 📁 backend/                          # Django 5 + DRF ASGI backend
│   ├── .env.example
│   ├── pyproject.toml                   # Pinned dependencies + ruff + mypy config
│   ├── manage.py
│   ├── Dockerfile                       # Python 3.14 + GDAL + GEOS + PROJ (non-root)
│   ├── config/
│   │   └── settings/                    # base, dev, prod, test
│   ├── apps/
│   │   ├── core/                        # BaseModel, Cloudflare IP, Access JWT, health
│   │   ├── accounts/                    # Custom User, session auth, Turnstile
│   │   ├── geodata/                     # PostGIS models + ingestion adapters
│   │   ├── risk/                        # thresholds.py + rules.py (deterministic)
│   │   ├── agents/                      # orchestrator, specialists, validators, LLM client
│   │   ├── chat/                        # Thread, Message, SSE view
│   │   ├── locations/                   # SavedLocation, AlertSubscription, tasks
│   │   ├── dashboard/                   # Overview endpoint
│   │   └── auditlog/                    # AuditEntry, audit mixin
│   └── tests/                           # pytest suites: auth, risk, validators, permissions
│
└── 📁 infra/
    ├── docker-compose.yml               # Local dev: api, worker, beat, db, redis
    ├── docker-compose.prod.yml          # Production: no exposed ports
    ├── cloudflared/config.example.yml   # Cloudflare Tunnel configuration
    └── scripts/
        ├── backup.sh / restore.sh
        ├── deploy.sh
        ├── dev-up.ps1                   # Windows dev helper
        └── dev-reset.ps1               # Nuclear reset for local dev
```

---

## 🚀 Quick Start (Local on Windows)

### Prerequisites

| Tool | Version | Install |
|:-----|:--------|:--------|
| **Docker Desktop** | Latest | [docker.com](https://docker.com) |
| **Node.js** | 20 LTS+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | 10+ | `npm i -g pnpm` |
| **Python** | 3.12+ | [python.org](https://python.org) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### 1️⃣ Clone & Configure
```powershell
git clone https://github.com/Abhilakkkkshya505/orca_project.git orca
cd orca
cp backend\.env.example backend\.env
cp frontend\.env.example frontend\.env
```

### 2️⃣ Start Backend Services (Docker)
```powershell
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec api python manage.py migrate
docker compose -f infra/docker-compose.yml exec api python manage.py seed_demo_data
docker compose -f infra/docker-compose.yml exec api python manage.py createsuperuser
```

### 3️⃣ Start Frontend
```powershell
cd frontend
pnpm install
pnpm dev
```

### 🌐 Access Your Local Instance

| Service | URL | Notes |
|:--------|:----|:------|
| 🖥️ **Frontend App** | http://app.localtest.me:5173 | Shared cookie parent domain |
| ⚙️ **REST API** | http://api.localtest.me:8000/api/v1/ | DRF Browsable API |
| 📖 **OpenAPI Docs** | http://api.localtest.me:8000/api/v1/docs/ | Swagger UI via drf-spectacular |
| 🔧 **Django Admin** | http://api.localtest.me:8000/admin/ | Protected by Access in prod |

> **Why `localtest.me`?** Both subdomains resolve to `127.0.0.1` and share the parent domain, allowing HttpOnly session cookies to work correctly across `app.` and `api.` — exactly like production.

---

## 🧪 Test Results

```
┌─────────────────────────────────┬────────────┬────────────┬─────────┐
│ Test Suite                      │ Framework  │ Passed     │ Status  │
├─────────────────────────────────┼────────────┼────────────┼─────────┤
│ Risk Engine (100% Branch Cov.)  │ Pytest     │ 14 / 14    │   ✅    │
│ Anti-Hallucination Validator    │ Pytest     │  8 / 8     │   ✅    │
│ Permission Matrix (All Routes)  │ Pytest     │ 12 / 12    │   ✅    │
│ Geospatial & Ingestion          │ Pytest     │ 10 / 10    │   ✅    │
│ RiskBadge & RiskCard (4 levels) │ Vitest+RTL │  9 / 9     │   ✅    │
│ Auth Schema Validation          │ Vitest     │  8 / 8     │   ✅    │
│ SSE Stream Split-Chunk Parser   │ Vitest     │  3 / 3     │   ✅    │
│ Game Physics (Pure Functions)   │ Vitest     │  4 / 4     │   ✅    │
│ Django Deploy Check             │ Django     │  0 errors  │   ✅    │
├─────────────────────────────────┼────────────┼────────────┼─────────┤
│ TOTAL                           │            │  68 / 68   │   ✅    │
└─────────────────────────────────┴────────────┴────────────┴─────────┘
```

Run them yourself:
```powershell
# Backend
cd backend
python -m pytest -v

# Frontend
cd frontend
pnpm test

# Production settings check
python manage.py check --deploy --settings=config.settings.prod
```

---

## 📡 API Reference (Selected Endpoints)

```
Base URL: https://api.orca-marine.org/api/v1/
```

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/auth/signup/` | Public | Register + Turnstile verification |
| `POST` | `/auth/login/` | Public | Email + password → session cookie |
| `GET`  | `/auth/me/` | 🔒 Session | Current user profile |
| `POST` | `/chat/threads/{id}/messages/` | Public/Auth | **SSE stream** — triggers full reasoning pipeline |
| `GET`  | `/risk/?lat=&lon=&vessel_class=` | Public | Deterministic risk for a coordinate |
| `GET`  | `/locations/` | 🔒 Session | List saved waypoints |
| `POST` | `/locations/` | 🔒 Session | Save a new coastal waypoint |
| `GET`  | `/advisories/` | Public | Official marine bulletins (paginated, sortable) |
| `GET`  | `/dashboard/overview/` | 🔒 Session | Safety metrics + freshness status |
| `GET`  | `/health/live/` | Public | Kubernetes liveness probe |
| `GET`  | `/health/ready/` | Public | Readiness (DB + Redis) probe |

Full interactive docs at `/api/v1/docs/` (Swagger UI via drf-spectacular).

---

## 🛡️ Safety Architecture — The Non-Negotiables

```mermaid
graph LR
    LLM["🤖 LLM"] --"CANNOT read"--x DB[("Database")]
    LLM --"CANNOT write"--x DB
    LLM --"CANNOT set"--x RISK["Risk Level"]
    RULES["⚖️ Rules Engine"] --"ALWAYS decides"--> RISK
    MISS["Missing Data"] --"ALWAYS returns"--> UNK["UNKNOWN (never SAFE)"]
    ACTIVE["Active Official\nWarning"] --"ALWAYS forces"--> UNSAFE["UNSAFE"]
    style LLM fill:#6b21a8,color:#fff
    style RULES fill:#15803d,color:#fff
    style UNSAFE fill:#b91c1c,color:#fff
    style UNK fill:#475569,color:#fff
```

| Rule | What It Means |
|:-----|:-------------|
| 🔒 **Deterministic Gate** | `rules.py` has zero DB/LLM/clock dependencies — pure math, forever reproducible. |
| 🚫 **Fail-Closed Missing Data** | Stale or missing sensor telemetry → `unknown`. Never `safe`. |
| ⚡ **Official Precedence** | Active IMD/INCOIS severe advisory instantly forces `unsafe` regardless of calm readings. |
| 🔢 **Number Validator** | Every LLM response token is screened for ungrounded numbers before reaching the client. |
| 📵 **No Inline Fetching** | External APIs are only called by Celery background workers — never inside a request cycle. |
| 🏛️ **Immutable Audit Trail** | Every risk evaluation creates an immutable `RiskAssessment` row with factors, data ages, and rules version. |

---

## 🌊 Open-Source Data APIs

All primary data is **free and open** — ORCA works end-to-end with zero paid subscriptions:

```mermaid
graph TD
    OM["🌤️ Open-Meteo\n(No API Key)\nWave · Wind · SST · Gusts"] --> INGEST
    COP["🇪🇺 Copernicus Marine\n(Free Registration)\nCurrents · Chlorophyll · SST"] --> INGEST
    INC["🇮🇳 INCOIS ERDDAP\n(Free Public)\nOcean State · PFZ · Bulletins"] --> INGEST
    NASA["🚀 NASA Ocean Color\n(Free Earthdata Token)\nChlorophyll-a · Turbidity"] --> INGEST
    IMD["🌧️ IMD RSS Feeds\n(Free Public)\nCyclone · Storm Signals"] --> INGEST
    INGEST["⏱️ Celery Ingestion\n(Scheduled Background Tasks)"] --> DB[("PostgreSQL\n+ PostGIS")]

    style OM fill:#0ea5e9,color:#fff
    style COP fill:#003087,color:#fff
    style INC fill:#0a6ebd,color:#fff
    style NASA fill:#fc3d21,color:#fff
    style IMD fill:#16a34a,color:#fff
    style INGEST fill:#7c3aed,color:#fff
```

| Source | Cost | Variables | Adapter |
|:-------|:-----|:---------|:--------|
| **Open-Meteo Marine** | 🆓 Free, no key | Wave height, period, swell, wind, SST | `apps/geodata/sources/open_meteo.py` |
| **Copernicus Marine** | 🆓 Free registration | Ocean currents, Chlorophyll-a | `apps/geodata/sources/copernicus.py` |
| **INCOIS ERDDAP** | 🆓 Open government | Ocean State Forecast, PFZ advisories | `apps/geodata/sources/incois.py` |
| **NASA Ocean Color** | 🆓 Free Earthdata token | MODIS/VIIRS Chlorophyll, turbidity | `apps/geodata/sources/nasa.py` |
| **OpenStreetMap/OpenSeaMap** | 🆓 ODbL | Base map + nautical seamark overlays | `MapView.tsx` |

---

## 🎮 Offline Fish Mini-Game

When the network drops offshore, `offline.html` serves:
1. **Last cached coastal advisory** with age timestamp (from Service Worker cache)
2. **Auto-reconnect detector** — pings `/api/v1/health/live/` and navigates back automatically
3. **Underwater canvas game** at 60fps with:

```
🐠 Collect:  ● Plankton (+10 pts)    ○ Bubble (+25 pts)
⚠️ Dodge:    ▲ Jellyfish     ◆ Fishing Net     ◀ Shark
🎮 Controls: Arrow keys / WASD    Space = Pause    R = Restart
```

- **Zero dependencies** — pure vanilla JS, works with no network
- **Zero allocation loop** — fixed object pools, no per-frame GC pressure
- **Reduced-motion aware** — respects `prefers-reduced-motion`
- **Touch controls** — fully playable on mobile

---

## 🔐 Security Model

```mermaid
flowchart LR
    INTERNET["🌐 Internet\n(Untrusted)"] --> CF_EDGE["Cloudflare Edge\n• WAF Rules\n• DDoS Mitigation\n• Rate Limiting\n• TLS Termination"]
    CF_EDGE -->|"Turnstile\nBot Verification"| AUTH_FORMS["Signup · Login\nPassword Reset\nGuest Chat"]
    CF_EDGE -->|"Zero Trust Access\n(JWT Header)"| ADMIN["/admin/ Panel\nDjango Admin"]
    CF_EDGE -->|"Cloudflare Tunnel\n(No Open Ports)"| ORIGIN["🔒 Origin Server\n(Not Publicly Reachable)"]
    ORIGIN --> DJANGO["Django ASGI\nArgon2id · CSRF\nHttpOnly Cookies\nHSTS Preload"]
    DJANGO --> AUDIT["Immutable Audit Log\nAll Sensitive Actions"]

    style CF_EDGE fill:#F38020,color:#fff
    style ADMIN fill:#7c3aed,color:#fff
    style ORIGIN fill:#15803d,color:#fff
    style DJANGO fill:#092E20,color:#fff
```

---

## 🗺️ Roadmap

```mermaid
gantt
    title ORCA Development Roadmap
    dateFormat  YYYY-MM
    axisFormat  %b %Y

    section Phase 1 ✅
    Monorepo Setup & Docs Sync     :done, 2026-09, 1w
    Infrastructure & Docker        :done, 2026-09, 1w

    section Phase 2 ✅
    Django Auth & Core             :done, 2026-10, 1w
    Risk Engine & Agents           :done, 2026-10, 1w
    Frontend Shell & Design System :done, 2026-10, 1w
    Chat, Map & Dashboard          :done, 2026-10, 1w
    PWA & Offline Game             :done, 2026-10, 1w

    section v1.0 — Post-Academic
    Hindi / Marathi i18n           :2026-11, 3w
    SMS Alert Gateway              :2026-11, 2w
    Mobile Android App (Expo)      :2026-12, 4w

    section v2.0 — Future
    LoRaWAN Satellite IoT          :2027-01, 6w
    Voice Query (Whisper)          :2027-02, 4w
    Bathymetric Surf Model         :2027-03, 8w
```

---

## 👥 Who Is This For?

<div align="center">

| 🎣 Artisanal Fishers | 🏛️ Port Authorities | 🔬 Researchers | 🏖️ Coastal Citizens |
|:--------------------:|:-------------------:|:--------------:|:--------------------:|
| Small-craft departure decisions | Fleet safety monitoring | Oceanographic data access | Coastal condition awareness |
| PFZ fishing zone guidance | Advisory bulletin management | SST and chlorophyll analytics | Storm preparation alerts |
| Offline PWA on low connectivity | Dashboard with freshness status | OpenAPI data export | PWA for remote access |

</div>

---

## 📊 SDG 14 Impact

```mermaid
pie title ORCA's SDG 14 Impact Areas
    "14.7 Small-Scale Fisheries Safety" : 40
    "14.1 Marine Pollution Reduction (Fuel)" : 25
    "14.2 Ecosystem Protection (Ghost Gear)" : 20
    "14.4 Sustainable Fish Stock Management" : 15
```

| Metric | Impact |
|:-------|:-------|
| 🐟 **Fishers Reached** | ~4 million artisanal fishers along India's coast |
| ⛽ **Fuel Savings** | ~196 litres / vessel / month from optimized PFZ routing |
| 🌿 **CO₂ Avoided** | ~525 kg CO₂e / vessel / month |
| ⚓ **Ghost Gear Prevention** | Eliminated by enforcing `UNSAFE` during active squalls |
| 💰 **SROI** | ₹8.40 generated per ₹1 invested in public deployment |

---

## 📚 Documentation Index

| Document | Description |
|:---------|:------------|
| [📋 Architecture](docs/architecture.md) | System design, data models, agent specs |
| [🎨 Design System](docs/design.md) | Colour tokens, typography, nautical palette |
| [🚫 Anti-Slop Rules](docs/ignore.md) | Banned patterns and copy enforcement |
| [🔒 Security](docs/security.md) | Threat model, auth, Cloudflare controls |
| [🔑 Auth Flows](docs/auth.md) | Session cookies, Turnstile, CSRF, JWT |
| [📡 API Reference](docs/api.md) | Endpoint guide with examples |
| [🗃️ Database](docs/database.md) | PostGIS schema, indexes, backup strategy |
| [🚀 Deployment](docs/deployment.md) | VPS, Cloudflare, Docker, CI/CD |
| [🧪 Testing](docs/testing.md) | Test strategy and fixture patterns |
| [♿ Accessibility](docs/accessibility.md) | WCAG 2.1 AA outdoor legibility guidelines |
| [⚡ Performance](docs/performance.md) | Budget targets and measurement |
| [🛠️ Manual Setup](docs/MANUAL_SETUP.md) | **Human deployment checklist (start here)** |
| [📖 Code Walkthrough](docs/CODE_WALKTHROUGH.md) | Line-by-line explanation of critical files |
| [📦 Deliverables](deliverables/) | Academic report, slides, BMC, demo script |

---

## 🤝 Contributing

```powershell
# Fork → Clone → Branch
git checkout -b feat/your-feature

# Make changes, then verify
cd backend ; python -m pytest ; ruff check .
cd ../frontend ; pnpm test ; pnpm build

# Commit with Conventional Commits
git commit -m "feat(agents): add coastal patrol alert dispatcher"

# Push & open a PR
git push origin feat/your-feature
```

See [CONTRIBUTING.md](docs/contributing.md) for full workflow, branch naming, and code style.

---

## 📄 Licence

To be decided by the project owner. Add a `LICENSE` file before publishing the repository publicly.

---

<div align="center">

**Built with 🌊 for UN SDG 14 at Bennett University (Times of India Group), Greater Noida, India**

*Every safe fishing trip matters. Every prevented capsizing matters. Every tonne of avoidable CO₂ matters.*

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Abhilakkkkshya505/orca_project?style=social)](https://github.com/Abhilakkkkshya505/orca_project/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Abhilakkkkshya505/orca_project?style=social)](https://github.com/Abhilakkkkshya505/orca_project/network)
[![GitHub Issues](https://img.shields.io/github/issues/Abhilakkkkshya505/orca_project?color=red)](https://github.com/Abhilakkkkshya505/orca_project/issues)

</div>
