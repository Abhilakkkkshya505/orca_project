# ORCA Task Progress Tracker

Current Date: **25 October 2026**  
Overall System State: **Tasks 0 through 5 Complete & Verified; Ready for Task 6 (Offline, Security & Final QA)**

---

## 1. Task Status Table (Tasks 0 to 6)

| Task | Title | Status | Date | Verify Script Result | Resume Point / Notes |
|---|---|---|---|---|---|
| **Task 0** | Stabilise keys & providers | **DONE (verified)** | 2026-10-19 | `scripts/verify-task0.ps1` (19/19 PASS) | All services running; PostGIS healthy; check_providers live; session cookies verified; 49/49 backend + 24/24 frontend tests pass. |
| **Task 1** | Ports and location | **DONE (verified)** | 2026-10-19 | `scripts/verify-task1.ps1` (9/9 PASS) | World ports table seeded (3,875 ports), sea-snapping, nearest ports, reverse geocoding, dynamic snapping, inland suggestions, zero Kochi defaults, 62/62 backend tests pass. |
| **Task 2** | Data pipelines & risk engine | **DONE (verified)** | 2026-10-19 | `scripts/verify-task2.ps1` (11/11 PASS) | Data contracts, adapters for all providers, 100% branch coverage on rules engine, property tests, 98/98 backend tests pass. |
| **Task 3** | Chat assistant | **DONE (verified)** | 2026-10-21 | `scripts/verify-task3.ps1` (10/10 PASS) | 7-step pipeline (Understand->Resolve->Gather->Decide->Enrich->Explain->Stream), Pydantic Intent, 0-key rule parser with Hindi translit, template explainer (26 templates), Rule S4 number validator, multi-turn follow-up/compare/clarify, 51/51 pytest + 24/24 vitest pass, NLU eval (Task 97.5% dev / 95% held-out). |
| **Task 4** | Train the models | **DONE (verified)** | 2026-10-21 | `scripts/verify-task4.ps1` (9/9 PASS) | Installable `orca_ml` package, canonical 15-feature pipeline (Rule 22), frozen adoption gates in `gate.yaml`, intent model active (macro-F1 1.0, latency 0.29ms), chl anomaly detector active (3 historical blooms backtested), fishing zone honestly marked UNFINISHED (GFW unset), wave error honestly marked SKIPPED (CDS unset), endpoints `GET /api/v1/models/` & `/card/` (JSON & Markdown), PSI feature drift monitoring, 10/10 pytest pass. |
| **Task 5** | Full frontend | **DONE (verified)** | 2026-10-21 | `scripts/verify-task5.ps1` (9/9 PASS) | All 26 public & protected routes active; scrolling bugs eliminated (no traps, cooperativeGestures); 10-section real landing page with rotating live SeaState port; WMO Douglas Scale wave animation; legal policies (Privacy, Terms with IMD override); required accepted_terms on signup UI + backend User model + migration; 46/46 vitest + 8/8 test_auth pass. |
| **Task 6** | Offline, security, final QA | **REMAINING** | 2026-10-25 | `scripts/verify-task6.ps1` (Pending) | Part A (Offline Playwright tests), Part B (Security check --deploy, 100% endpoint permission matrix, CSP validation), Part C (Production compose validation), Part D (Deliverables & walkthrough audit), Part E (`verify-all.ps1` & `FINAL-AUDIT.md`). |

---

## 2. Unfinished Scope: Task 6 (Offline, Security, Final QA)

### Part A: Offline Tests & PWA Verification
- [ ] Run Playwright automated offline tests: load app online, visit two ports, set context offline, reload, confirm `offline.html` displays saved ports with ages.
- [ ] Verify canvas fish mini-game under touch and keyboard emulation at 60fps.
- [ ] Verify automatic reconnect detection back to active state within 10 seconds.
- [ ] Assert stale cached risk (>12h) displays `UNKNOWN` with `STALE` banner (Safety Rule S2).

### Part B: Security Hardening & Permission Matrix
- [ ] Run `python manage.py check --deploy --settings=config.settings.prod` with dummy production env values; resolve all warnings.
- [ ] Re-run full automated auth checklist from `docs/auth.md` (signup enumeration, lockout, CSRF, Turnstile fail-closed).
- [ ] Run automated permission matrix test ensuring 100% endpoint coverage across anonymous, guest, unverified, verified owner, other verified, staff.
- [ ] Verify Cloudflare helpers: `CF-Connecting-IP` spoofing tests, Access JWT middleware verification.
- [ ] Run CSP securitypolicyviolation sweep across all routes.
- [ ] Run dependency audits (`pip-audit`, `pnpm audit --prod`) and secret scans.
- [ ] Verify log-scrubbing (no emails, session tokens, or raw coordinates logged).

### Part C: Production Infra & Deployment Verification
- [ ] Verify `docker-compose.prod.yml` and production Dockerfile boot locally with dummy production env.
- [ ] Validate GitHub Actions workflow YAML syntax (`actionlint`).

### Part D: Final Course Documentation
- [ ] Ensure `docs/CODE_WALKTHROUGH.md`, `docs/PROJECT-REPORT.md`, `docs/DEMO-SCRIPT.md` are aligned with live Task 4 ML metrics and Task 5 routes.
- [ ] Update `CHANGELOG.md` and regenerate OpenAPI schema (`backend/schema.yml`) and frontend types.

### Part E: Regression & Final Audit
- [ ] Build `scripts/verify-all.ps1` executing `verify-task0.ps1` through `verify-task6.ps1` sequentially with summary table.
- [ ] Repo hygiene scan: clean console.log, print() in backend apps, raw `any` types, and banned words.
- [ ] Generate comprehensive `docs/FINAL-AUDIT.md`.
