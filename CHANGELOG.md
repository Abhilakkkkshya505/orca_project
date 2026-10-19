# Changelog

All notable changes to ORCA are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow Semantic Versioning (pre-1.0: minor versions may include breaking changes, which are always noted).

## [Unreleased]

### Added
- Project documentation set: architecture, design system, anti-slop rules, backend, frontend, security, auth, API, database, deployment, testing, observability, accessibility, SEO, performance, contributing and roadmap.
- Monorepo layout for `frontend/`, `backend/`, `docs/` and `infra/`.

### Decisions recorded
- Frontend: Vite + React SPA on Cloudflare Pages.
- Backend: Django + DRF in Docker on an India-region VPS, reachable only through a Cloudflare Tunnel.
- Auth: Django session cookies on a shared parent domain, Turnstile on auth endpoints, Cloudflare Access in front of `/admin/`.
- Risk level is decided by a deterministic rules engine. The LLM routes questions and writes explanations only.
- Missing or stale data produces `unknown`, never `safe`.

## [0.1.0] - 2026-10-19

### Added - Task 0: Stabilise Stack, Keys & Providers
- PostGIS 16 and Redis 7 healthy container stack running under Docker Compose.
- Provider registry in `backend/apps/geodata/providers.py` tracking credentials, rate limits, and attribution.
- Management command `check_providers` and `scripts/check-keys.ps1` testing live API connectivity with zero secret leakage.
- Public endpoint `/api/v1/data-status/` returning provider freshness and required attribution credits.
- Frontend `Attribution` component in `landing.tsx` complying with CC-BY 4.0 and open data licenses.
- Environment variable validation in settings reporting all missing required production variables at once.
- Security enforcement rejecting `DEV_BYPASS_ACCESS=true` when `ENVIRONMENT=production`.
- Development helper scripts: `scripts/dev-up.ps1`, `scripts/dev-down.ps1`, `scripts/dev-reset.ps1`, and `scripts/verify-task0.ps1`.
- Celery debug ping task and beat schedule loading validation.
- Vite 6 `server.allowedHosts` configuration supporting `.localtest.me` cross-subdomain cookies.
- Comprehensive test suite for Task 0 (`backend/tests/test_task0.py`).

