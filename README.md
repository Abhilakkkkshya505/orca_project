# ORCA — Oceanic Reasoning & Coastal Assistant
### Deterministic Marine Safety Intelligence Powered by Collaborative AI Agents

<div align="center">

<img src="https://img.shields.io/badge/SDG%2014-Life%20Below%20Water-0A97D9?style=for-the-badge&logo=un&logoColor=white" />
<img src="https://img.shields.io/badge/Version-1.0.0--dev-22c55e?style=for-the-badge" />
<img src="https://img.shields.io/badge/Tests-150%2B%20Passing-22c55e?style=for-the-badge&logo=pytest&logoColor=white" />
<img src="https://img.shields.io/badge/Verification-Tasks%200--5%20PASS-38bdf8?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

<br/>

```
  ___  ____   ____    _   
 / _ \|  _ \ / ___|  / \  
| | | | |_) | |     / _ \ 
| |_| |  _ <| |___ / ___ \
 \___/|_| \_\\____/_/   \_\
```

#### *Real-Time Coastal Risk Assessment • 3,875+ World Ports • WMO Douglas Sea Scale Physics*

> **4 million artisanal fishers. 7,516 km of coastline. One platform that never guesses.**

[Explore Live Demo](https://app.orca-marine.org) • [Architecture Guide](docs/architecture.md) • [Report Issue](https://github.com/Abhilakkkkshya505/orca_project/issues) • [Development Roadmap](docs/roadmap.md)

</div>

---

## 🌊 What Is ORCA?

**ORCA (Oceanic Reasoning & Coastal Assistant)** converts complex, scattered oceanographic telemetry into clear, auditable coastal safety ratings for any port or marine coordinates.

Built specifically in support of **UN Sustainable Development Goal 14: Life Below Water**, ORCA is designed for artisanal fishers, port operators, and coastal communities.

```
  User query: "Is it safe to depart Fort Kochi today with a small canoe?"
                                │
                    ┌───────────▼───────────┐
                    │ Multi-Agent Orchestrator│
                    └───────────┬───────────┘
              Weather ┌─ Ocean  ┼  Sat.  ─┐ Advisory
                Agent │  State  │  Agent  │  Agent
                      │  Agent  │         │
                    ┌─▼─────────▼─────────▼─┐
                    │ DETERMINISTIC RULES   │
                    │ (Pure Math • No LLM)  │
                    └───────────┬───────────┘
                                │
                ┌───────────────▼───────────────┐
                │ RISK LEVEL: ⚠️ CAUTION         │
                │ Wave Height: 1.8m (> 1.5m limit)│
                │ Valid until: 18:00 UTC        │
                │ Data Age: 47 min              │
                └───────────────────────────────┘
```

### 🛡️ Safety-First Core Tenet
> ORCA is an intelligent decision-support platform, **not** an official sovereign warning agency. Official IMD and INCOIS warnings strictly override all telemetry. If telemetry is missing or stale (>24h), ORCA returns **`UNKNOWN`** — it **never** defaults to safe.

---

## 🚀 Key Platform Features

| Feature | Description |
|:---|:---|
| ⚙️ **Deterministic Risk Engine** | Safety ratings are evaluated by pure mathematical functions (`rules.py`) with zero database reads, zero LLM variance, and 100% branch test coverage. |
| 🤖 **Multi-Agent Orchestrator** | Specialized agents (Weather, Ocean State, Satellite, Advisory, Fishing Zone) extract and normalize telemetry into strict Pydantic data contracts. |
| 🛡️ **Rule S4 Anti-Hallucination Validator** | Regex-based numeric ground-truth validator that rejects any response containing unverified metrics. |
| ⚓ **3,875+ World Ports & Sea-Snapping** | Global ports database with sea-point snapping ensuring inland queries automatically resolve to nearest navigable waters. |
| 🌊 **WMO Douglas Scale SeaState Waves** | Real-time SVG wave physics dynamically driven by significant wave height ($H_s$) and swell period with reduced-motion accessibility. |
| 💬 **SSE Streaming Chat Pipeline** | 7-stage streaming pipeline (*Understand → Resolve → Gather → Decide → Enrich → Explain → Stream*) with zero-key Hindi transliteration support. |
| 📱 **Zero-Dependency Offline PWA** | Autonomous offline page (`offline.html`) with cached coastal advisories, connection recovery detection, and a 60fps canvas mini-game. |
| ♿ **WCAG 2.1 AA Compliant** | Risk levels conveyed through **Icon + Shape + Text + Colour** with 7:1 outdoor high-contrast themes. |
| 🔒 **Cloudflare Zero Trust** | Edge WAF, Turnstile bot deterrence, Zero Trust Access for admin panels, and cross-subdomain HttpOnly sessions. |

---

## 📊 Development Progress & Verification Status

ORCA is engineered with automated verification scripts for every phase:

| Phase | Milestone | Status | Automated Test Result |
|:---|:---|:---:|:---|
| **Task 0** | **Stack Stabilisation & Provider Probes** | ✅ **VERIFIED** | `scripts/verify-task0.ps1` (19/19 PASS) — All services, PostGIS, live provider probes, session auth |
| **Task 1** | **World Ports & Sea-Snapping** | ✅ **VERIFIED** | `scripts/verify-task1.ps1` (9/9 PASS) — 3,875 ports seeded, snapping logic, zero hardcoded Kochi defaults |
| **Task 2** | **Data Contracts & Risk Rules** | ✅ **VERIFIED** | `scripts/verify-task2.ps1` (11/11 PASS) — Weather/ocean adapters, 100% branch coverage, property tests |
| **Task 3** | **Streaming Chat & NLU Pipeline** | ✅ **VERIFIED** | `scripts/verify-task3.ps1` (10/10 PASS) — 7-step SSE stream, Hindi translit parser, Rule S4 validator |
| **Task 4** | **Advisory ML Models & Gating** | ✅ **VERIFIED** | `scripts/verify-task4.ps1` (9/9 PASS) — `orca_ml` package, 15-feature schema, frozen `gate.yaml` adoption |
| **Task 5** | **Full Frontend & Douglas Waves** | ✅ **VERIFIED** | `scripts/verify-task5.ps1` (9/9 PASS) — 26 active routes, Douglas wave animation, legal compliance |
| **Task 6** | **Offline PWA Hardening & Final QA** | ⏳ **REMAINING** | `scripts/verify-task6.ps1` (Next Up) — Playwright offline suite, deploy security check, audit report |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    U["👤 User (Fisher / Researcher / Authority)"]
    U -->|"HTTPS Chat Query"| CF["🛡️ Cloudflare Edge\nWAF • Turnstile • Access • DDoS"]
    CF -->|"Cloudflare Tunnel (no open ports)"| API["⚡ Django 5 ASGI\n(Uvicorn)"]

    API --> ORCH["🤖 Multi-Agent Orchestrator"]
    ORCH --> WA["🌤️ Weather Agent"]
    ORCH --> OA["🌊 Ocean State Agent"]
    ORCH --> SA["🛰️ Satellite Agent"]
    ORCH --> AA["📢 Advisory Agent"]
    ORCH --> FZA["🐟 Fishing Zone Agent"]

    WA --> RULES["📐 Deterministic Rules Engine\nrules.py — Pure Mathematical Logic\nNo LLM • No DB Reads • No Clock"]
    OA --> RULES
    SA --> RULES
    AA --> RULES

    RULES -->|"SAFE / CAUTION / UNSAFE / UNKNOWN"| VAL["🛡️ Numeric Validator\nvalidators.py"]
    VAL -->|"Grounded Explanation"| SSE["📡 SSE Stream\nstatus • risk • map • token • done"]
    SSE -->|"HTTP/1.1 text/event-stream"| U

    CELERY["⏰ Celery Beat\n(Background Ingestion)"] -->|"Scheduled Ingestion"| OM["Open-Meteo\nMarine API"]
    CELERY --> COP["Copernicus\nMarine Service"]
    CELERY --> INC["INCOIS\nAdvisories"]
    CELERY --> NASA["NASA\nOcean Color"]
    OM --> DB[("🗄️ PostgreSQL 16\n+ PostGIS")]
    COP --> DB
    INC --> DB
    NASA --> DB
    DB --> API
    REDIS[("⚡ Redis 7\nCache • Throttle • Token Budget")] --> API

    FE["💻 React 19 SPA\nVite • TypeScript • Tailwind\nMapLibre GL • PWA"] -->|"HTTPS"| CF
    FE --> U
```

---

## ⚖️ Safety Evaluation Hierarchy

```mermaid
flowchart LR
    IN["📡 Telemetry & Advisories"] --> CHK{"Official Severe\nWarning?"}
    CHK -->|"Yes"| UNSAFE["🚨 UNSAFE\n(Overrides all sensor data)"]
    CHK -->|"No"| STALE{"Data Missing\nor Stale > 24h?"}
    STALE -->|"Yes"| UNK["❓ UNKNOWN\n(Never defaults to safe)"]
    STALE -->|"No"| THRESH{"Vessel Class\nThresholds"}
    THRESH -->|"Hs > 2.5m or Wind > 30kn"| UNSAFE2["🚨 UNSAFE"]
    THRESH -->|"Hs > 1.5m or Wind > 20kn"| CAUT["⚠️ CAUTION"]
    THRESH -->|"All In Bounds"| SAFE["✅ SAFE"]

    style UNSAFE fill:#ef4444,color:#fff,stroke:#b91c1c
    style UNSAFE2 fill:#ef4444,color:#fff,stroke:#b91c1c
    style CAUT fill:#f59e0b,color:#1a1a1a,stroke:#d97706
    style SAFE fill:#22c55e,color:#fff,stroke:#16a34a
    style UNK fill:#64748b,color:#fff,stroke:#475569
```

---

## 🛠️ Technology Stack

<div align="center">

### Frontend Architecture
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-396CB2?style=for-the-badge&logo=maplibre&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

### Backend & Machine Learning
![Python](https://img.shields.io/badge/Python_3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django_5.x-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST_Framework-A30000?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16_+_PostGIS-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)

### Infrastructure & Deployment
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

</div>

---

## 📁 Monorepo Structure

```
orca/
├── README.md                          # Comprehensive showcase & instructions
├── CLAUDE.md                          # AI development & architecture conventions
├── CHANGELOG.md                       # Conventional Commits changelog
├── PROGRESS.md                        # Active task progress matrix
├── backend/                           # Django 5 ASGI application
│   ├── apps/
│   │   ├── accounts/                  # User model, session auth, Turnstile
│   │   ├── agents/                    # Multi-agent orchestrator & Rule S4 validator
│   │   ├── auditlog/                  # Tamper-evident evaluation history
│   │   ├── chat/                      # SSE streaming chat endpoints & threads
│   │   ├── core/                      # Cloudflare headers, health probes
│   │   ├── dashboard/                 # Safety summaries & port conditions
│   │   ├── geodata/                   # PostGIS models & provider adapters
│   │   ├── locations/                 # Saved waypoints & custom alerts
│   │   ├── ports/                     # 3,875 ports table & sea-snapping
│   │   └── risk/                      # Pure mathematical rules engine & thresholds
│   ├── ml/                            # orca_ml package, adoption gate.yaml & model cards
│   ├── tests/                         # Pytest test suites (100+ tests)
│   └── manage.py
├── frontend/                          # React 19 + TypeScript SPA
│   ├── public/
│   │   ├── offline.html               # Autonomous offline app + mini-game
│   │   └── sw.js                      # Service Worker caching rules & stale detection
│   ├── src/
│   │   ├── app/                       # Routing & application shell (26 routes)
│   │   ├── components/                # UI kit, SeaState waves, MapLibre chart
│   │   ├── features/                  # Chat stream, auth, risk cards, ports directory
│   │   └── test/                      # Vitest test suites (46 tests)
│   └── package.json
├── infra/                             # Infrastructure definitions
│   ├── docker-compose.yml             # Local dev stack (db, redis, api, worker, beat)
│   ├── docker-compose.prod.yml        # Hardened production stack
│   └── cloudflared/                   # Zero Trust tunnel configurations
├── deliverables/                      # Academic sustainability reports & presentations
└── scripts/                           # Verification harnesses (verify-task0.ps1 to task5.ps1)
```

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 20 LTS+** with **pnpm 10+**
- **Docker Desktop**

### 2. Setup Environment
```powershell
# Clone repo
git clone https://github.com/Abhilakkkkshya505/orca_project.git
cd orca_project

# Copy sample configs
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

### 3. Launch Backend
```powershell
# Start database & redis
docker compose -f infra/docker-compose.yml up -d db redis

# Run migrations & seed ports
cd backend
python manage.py migrate
python manage.py seed_ports
python manage.py check_providers

# Run local API
python manage.py runserver 8000
```

### 4. Launch Frontend
```powershell
cd ../frontend
pnpm install
pnpm dev
```
Access the application at `http://localhost:5173` or `http://app.localtest.me:5173`.

---

## 🧪 Automated Verification Scripts

Each phase features an automated PowerShell verification harness:

```powershell
# Verify Task 0: Infrastructure, services & provider API keys
powershell -ExecutionPolicy Bypass -File scripts\verify-task0.ps1

# Verify Task 1: 3,875 Ports database & sea-snapping
powershell -ExecutionPolicy Bypass -File scripts\verify-task1.ps1

# Verify Task 2: Data pipeline contracts & deterministic risk rules
powershell -ExecutionPolicy Bypass -File scripts\verify-task2.ps1

# Verify Task 3: Multi-turn streaming chat & Rule S4 validator
powershell -ExecutionPolicy Bypass -File scripts\verify-task3.ps1

# Verify Task 4: Machine learning models & adoption gates
powershell -ExecutionPolicy Bypass -File scripts\verify-task4.ps1

# Verify Task 5: 26 Routes, SeaState animation & legal UI
powershell -ExecutionPolicy Bypass -File scripts\verify-task5.ps1
```

---

## 🛡️ The 10 Core Safety Rules (S1 to S10)

1. **S1 (Deterministic Rule)**: Risk calculations are pure mathematical functions without LLM hallucinations.
2. **S2 (Unknown State Policy)**: Missing or stale telemetry (>24h) returns `UNKNOWN` — never defaults to `SAFE`.
3. **S3 (Official Override)**: Active IMD/INCOIS cyclone or gale warnings immediately override sensor metrics to `UNSAFE`.
4. **S4 (Number Validator)**: Any numeric value emitted by the conversational explainer is validated against real sensor telemetry.
5. **S5 (Vessel Differentiation)**: Thresholds are adjusted per vessel class (artisanal canoe vs. mechanized trawler).
6. **S6 (Sea-Point Snapping)**: Inland coordinate queries snap to genuine navigable waters with distance warnings.
7. **S7 (Immutable Audit)**: Every safety evaluation is logged with full feature provenance.
8. **S8 (Fail-Closed Auth)**: Cloudflare Turnstile and session protections fail closed on anomaly.
9. **S9 (Zero-Leak Logs)**: Sensitive user telemetry and coordinates are scrubbed from production logs.
10. **S10 (Legal Transparency)**: Explicit disclaimer that ORCA provides decision-support and does not replace official state bulletins.

---

## 🌐 Open Telemetry Attributions

- **Open-Meteo Marine API**: Wave height, direction, swell period, and wind speed.
- **NOAA ERDDAP / Copernicus Marine**: Sea surface temperature and chlorophyll-a concentrations.
- **INCOIS (Indian National Centre for Ocean Information Services)**: Potential Fishing Zone (PFZ) advisories and ocean state bulletins.
- **GDACS**: Global disaster alerts and cyclone tracks.

---

## 📜 Academic Affiliation & License

Developed as part of the **Sustainability Studies Programme (Sem 1)** at **Bennett University (Times of India Group)**, Greater Noida, India.  
Focus Area: **UN Sustainable Development Goal 14: Life Below Water**.

License: MIT License. See [LICENSE](LICENSE) for details.
