# ORCA Task Progress Tracker

Current Date: **19 October 2026**  
Overall System State: **Analysis Completed; Ready for Task Execution**

---

## 1. Task Status Table (Tasks 0 to 6)

| Task | Title | Status | Date | Verify Script Result | Resume Point / Notes |
|---|---|---|---|---|---|
| **Task 0** | Stabilise keys & providers | **DONE (verified)** | 2026-10-19 | `scripts/verify-task0.ps1` (19/19 PASS) | All services running; PostGIS healthy; check_providers live; session cookies verified; 49/49 backend + 24/24 frontend tests pass. |
| **Task 1** | Ports and location | **DONE (verified)** | 2026-10-19 | `scripts/verify-task1.ps1` (9/9 PASS) | World ports table seeded (3,875 ports), sea-snapping, nearest ports, reverse geocoding, dynamic snapping, inland suggestions, zero Kochi defaults, 62/62 backend tests pass. |
| **Task 2** | Data pipelines & risk engine | **NOT STARTED** | — | `scripts/verify-task2.ps1` (Pending) | Pure deterministic rules engine 100% branch coverage, property tests, data contracts. |
| **Task 3** | Chat assistant | **NOT STARTED** | — | `scripts/verify-task3.ps1` (Pending) | SSE streaming, multi-turn chat, number validation against hallucination, template mode. |
| **Task 4** | Train the models | **NOT STARTED** | — | `scripts/verify-task4.ps1` (Pending) | Advisory models (fishing zones, algal bloom, intent), gate evaluation script. |
| **Task 5** | Full frontend | **NOT STARTED** | — | `scripts/verify-task5.ps1` (Pending) | All missing pages (ports, compare, how-it-works, methodology, status, about), wave animation, real scrolling landing page. |
| **Task 6** | Offline, security, final QA | **NOT STARTED** | — | `scripts/verify-task6.ps1` (Pending) | Offline PWA, standalone canvas fish game, security headers, course deliverables audit. |

---

## 2. In-Progress Task Detail: Task 0 (Stabilise the Stack, Wire Keys, Prove Providers)

### Current Progress & Foundation
- [x] Backend system checks pass cleanly (`python manage.py check`: 0 issues).
- [x] Backend unit & permission test suite passes (`python -m pytest`: 44/44 passed).
- [x] Frontend build & type check passes (`tsc && vite build`: built in 7.66s, 0 errors).
- [x] Frontend Vitest suite passes (`pnpm test`: 24/24 passed).
- [x] `.env` files created from templates for backend and frontend; `.env` verified in `.gitignore`.
- [x] Spec documents synchronized into `orca/docs/` and `orca/docs/agent-prompts/`.

### Unfinished Items for Task 0
1. [ ] Ensure Docker Desktop engine is active on host; verify `infra/docker-compose.yml` (`db`, `redis`, `api`, `worker`, `beat`).
2. [ ] Implement `python manage.py check_providers` making live test calls to Open-Meteo, NOAA ERDDAP, GDACS, and LLM (template mode) without leaking secrets.
3. [ ] Implement `GET /api/v1/data-status/` public health indicator.
4. [ ] Create `scripts/verify-task0.ps1` testing clean boot, health probes, manage checks, provider connectivity, and git history cleanliness.
5. [ ] Write `docs/PROVIDERS.md` and verify Attribution component in UI.

---

## 3. Recommended Order of Work

1. **TARGET: TASK 0** — Stabilise Docker environment, run migrations on PostGIS, implement provider check command and health checks, run `verify-task0.ps1`.
2. **TARGET: TASK 1** — Implement world ports database (`apps.ports`), coordinate sea-snapping, remove hardcoded Kochi defaults from backend and frontend, run `verify-task1.ps1`.
3. **TARGET: TASK 2** — Enhance data pipelines, property-based risk tests, cited thresholds, run `verify-task2.ps1`.
4. **TARGET: TASK 3** — Wire robust chat assistant with SSE streaming, fallback offline thread creation, and number validator, run `verify-task3.ps1`.
5. **TARGET: TASK 4** — Advisory ML models and gating script, run `verify-task4.ps1`.
6. **TARGET: TASK 5** — Full frontend expansion: register all missing routes (`/ports`, `/compare`, `/how-it-works`, `/methodology`, `/about`, `/status`), wave animations, terms/privacy links on auth screens, scrolling landing page, run `verify-task5.ps1`.
7. **TARGET: TASK 6** — PWA offline testing, canvas mini-game integration, security audit, final course deliverables, run `verify-all.ps1`.
