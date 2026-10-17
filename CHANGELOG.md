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

## [0.1.0] - not yet released

Initial MVP. Entries will be filled in at release.
