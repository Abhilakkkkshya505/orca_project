# Deployment

Django cannot run on Cloudflare Workers or Pages. The frontend runs on Cloudflare Pages. The backend runs in Docker on an India-region VPS, reachable only through a Cloudflare Tunnel.

Anything marked **verify** must be checked against current provider documentation before you rely on it. Prices and regions change.

## 1. Topology

```
Browser -> Cloudflare (DNS, proxy, WAF, Turnstile)
  app.orca.example   -> Cloudflare Pages (static SPA)
  api.orca.example   -> Cloudflare Tunnel -> cloudflared container -> api container (uvicorn)
  api.orca.example/admin/* -> same, behind Cloudflare Access
  assets.orca.example (optional) -> R2 public bucket for PMTiles basemap
VPS (Docker Compose): api, worker, beat, db (PostGIS), redis, cloudflared
```

## 2. Backend host choice

| Option | Cost | Ops effort | Latency for Indian users | Notes |
|---|---|---|---|---|
| **VPS with Docker Compose in an India region** (e.g. DigitalOcean Bangalore, AWS Lightsail Mumbai; verify availability) | Lowest | Medium: you patch the OS, run backups | Best | PostGIS, Redis, Celery on one box. MVP choice. |
| Fly.io | Low to medium | Low | Good if a Mumbai region is offered (verify) | Managed Postgres with PostGIS needs checking. Good later step. |
| Railway or Render | Medium | Lowest | Likely Singapore or similar (verify) | Easy, but extra latency and PostGIS support to check. |
| Cloudflare Containers | Unknown | Unknown | Unknown | Not used. Not verified to fit this workload (Django, PostGIS, Celery). Re-evaluate later. |

Minimum starting size: 2 vCPU, 4 GB RAM, 50 GB SSD. Adjust after a load test. Use a snapshot or backup feature from the provider in addition to our own backups.

## 3. Manual configuration checklist

Do these once, in this order.

### 3.1 Domain and Cloudflare account
1. Register or choose the domain. Replace `orca.example` everywhere (search the repo for it).
2. Add the zone to Cloudflare and set the registrar's nameservers.
3. SSL/TLS mode: **Full (strict)**. Enable "Always Use HTTPS". Minimum TLS 1.2.
4. DNS records are created automatically by Pages and Tunnel (see below). Proxy (orange cloud) on for `app` and `api`.

### 3.2 Cloudflare Pages (frontend)
1. Create a Pages project connected to the GitHub repo.
2. Root directory `frontend`, build command `pnpm install --frozen-lockfile && pnpm build`, output directory `dist`. Set the Node version through the project settings or `.nvmrc` (verify).
3. Environment variables (production and preview): `VITE_API_BASE_URL`, `VITE_TURNSTILE_SITE_KEY`, `VITE_SENTRY_DSN`, `VITE_ENV`, `VITE_PMTILES_URL`.
4. Custom domain `app.orca.example`.
5. Confirm `_headers` and `_redirects` from `frontend/public/` are applied (see `security.md`). SPA fallback in `_redirects`: `/* /index.html 200`.

### 3.3 VPS
1. Create the VPS in an India region with Ubuntu LTS.
2. Create a non-root sudo user, add SSH keys, disable password SSH login and root login.
3. Firewall (`ufw`): deny all inbound except SSH from your IP or a bastion. **No inbound 80 or 443.**
4. Enable automatic security updates (`unattended-upgrades`).
5. Install Docker Engine and the Compose plugin.
6. Create `/opt/orca` with `docker-compose.prod.yml`, `.env` (chmod 600), `cloudflared/` config.

### 3.4 Cloudflare Tunnel
1. In Cloudflare Zero Trust, create a Tunnel named `orca-api`. Copy the tunnel token into `.env` as `CLOUDFLARED_TUNNEL_TOKEN`. (Verify current UI path and token-based run instructions.)
2. Add a public hostname: `api.orca.example` -> service `http://api:8000`.
3. The `cloudflared` container runs with `tunnel run` and the token. It reaches `api` over the internal Docker network.
4. Confirm the DNS record for `api` was created and is proxied.

### 3.5 Cloudflare Access (admin)
1. Zero Trust, Access, Applications, add a Self-hosted application.
2. Domain `api.orca.example`, path `admin`. (Add `admin/*` and `admin` if the UI requires it. Verify.)
3. Policy: Allow, include specific staff emails. Identity: one-time PIN or your IdP.
4. Copy the Application Audience (AUD) tag into `CF_ACCESS_AUD`, and set `CF_ACCESS_TEAM_DOMAIN` to `<team>.cloudflareaccess.com`.
5. Optionally protect `api.orca.example/api/v1/docs/` and `/schema/` the same way.

### 3.6 Turnstile
1. Cloudflare dashboard, Turnstile, add a widget for `app.orca.example` (and `staging` hostnames if used).
2. Put the site key in `VITE_TURNSTILE_SITE_KEY` and the secret in `TURNSTILE_SECRET_KEY` (server only).
3. Use separate widgets for production and staging.

### 3.7 WAF and rate limiting rules (verify rule syntax and plan limits)
Start with:

| Rule | Match | Action |
|---|---|---|
| Rate limit auth | URI path starts with `/api/v1/auth/` | Block or challenge after 20 requests per minute per IP |
| Rate limit chat | URI path starts with `/api/v1/chat/` | Challenge after 30 requests per minute per IP |
| Block non-expected methods | Method not in GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD on `api.` | Block |
| Managed rules | Cloudflare managed ruleset | Enable (log first, then block) |
| Bot protection | Enable the features available on your plan | Review in log mode first |
| Large bodies | Request body over 64 KB to `api.` | Block (if supported by plan, else rely on Django limit) |

Review the Security Events log weekly during the first month.

### 3.8 R2
1. Create buckets: `orca-data` (private, raw ingested files), `orca-backups` (private), `orca-assets` (public read through a custom domain, holds the PMTiles basemap).
2. Create an API token scoped to `orca-data` and `orca-backups` with object read and write. Put values in `R2_*` env vars.
3. CORS on `orca-assets`: allow `GET`, `HEAD` and the `Range` header from `https://app.orca.example`. (Verify the CORS config format in R2 docs.)
4. Upload the India coast PMTiles extract. Record the source and licence in `docs/data-licences.md`.

### 3.9 Email provider
Pick a transactional email provider (verify availability and pricing for India). Requirements: SMTP or API, SPF and DKIM on `orca.example`, a bounce webhook or manual review. Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`. Add DNS records the provider gives you. Test with a real inbox before launch.

### 3.10 Data providers and LLM
- Copernicus Marine account: `COPERNICUSMARINE_USERNAME`, `COPERNICUSMARINE_PASSWORD`.
- NASA Earthdata account (if used): token in `EARTHDATA_TOKEN`.
- Open-Meteo: free tier needs no key. Check terms for your use. Commercial plan key goes in `OPEN_METEO_API_KEY`.
- INCOIS and IMD: confirm access method and terms. Record in `docs/data-licences.md`.
- LLM: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` (for the Anthropic API this is `ANTHROPIC_API_KEY`), `LLM_DAILY_TOKEN_BUDGET`. Set a hard spend limit in the provider console as well.

### 3.11 Monitoring accounts
Sentry project for backend and one for frontend. External uptime monitor on `https://api.orca.example/api/v1/health/ready/` and `https://app.orca.example/`.

## 4. Environment variables (backend)

| Variable | Required | Meaning |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | yes | `config.settings.prod` |
| `SECRET_KEY` | yes | long random string |
| `ENVIRONMENT` | yes | `local`, `staging`, `production` |
| `ALLOWED_HOSTS` | yes | `api.orca.example` |
| `CSRF_TRUSTED_ORIGINS` | yes | `https://app.orca.example` |
| `CORS_ALLOWED_ORIGINS` | yes | `https://app.orca.example` |
| `COOKIE_DOMAIN` | yes | `.orca.example` |
| `FRONTEND_URL` | yes | `https://app.orca.example` |
| `DATABASE_URL` | yes | `postgis://orca_app:...@db:5432/orca` |
| `DATABASE_MIGRATE_URL` | deploy only | uses `orca_migrate` |
| `REDIS_URL` | yes | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | yes | `redis://redis:6379/1` |
| `TRUST_CF_HEADERS` | yes | `true` in production behind Tunnel |
| `TURNSTILE_SECRET_KEY` | yes | server secret |
| `CF_ACCESS_TEAM_DOMAIN` | yes | `<team>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | yes | Access application AUD tag |
| `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_DATA`, `R2_BUCKET_BACKUPS` | yes | R2 access |
| `EMAIL_*`, `DEFAULT_FROM_EMAIL` | yes | email |
| `SENTRY_DSN` | yes | backend DSN |
| `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_DAILY_TOKEN_BUDGET` | yes | LLM |
| `COPERNICUSMARINE_USERNAME`, `COPERNICUSMARINE_PASSWORD` | yes | data |
| `EARTHDATA_TOKEN`, `OPEN_METEO_API_KEY` | optional | data |
| `COVERAGE_BBOX` | yes | `min_lon,min_lat,max_lon,max_lat` for the supported coast |
| `RISK_OUTPUT_ENABLED` | yes | `true` or `false` kill switch |
| `CLOUDFLARED_TUNNEL_TOKEN` | host only | Tunnel token |

Frontend (`VITE_` values are public): `VITE_API_BASE_URL`, `VITE_TURNSTILE_SITE_KEY`, `VITE_SENTRY_DSN`, `VITE_ENV`, `VITE_PMTILES_URL`.

## 5. Dockerfile (backend)

Outline (final file lives in `backend/Dockerfile`):

```dockerfile
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      gdal-bin libgdal-dev libgeos-dev libproj-dev libpq5 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
COPY . .
RUN python manage.py collectstatic --noinput --settings=config.settings.prod_build
RUN useradd -r -u 10001 orca && chown -R orca /app
USER orca
EXPOSE 8000
CMD ["uvicorn", "config.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "3", "--proxy-headers", "--forwarded-allow-ips", "*"]
```

Notes:
- The package manager (`uv` here) is a choice. Any lockfile-based tool is fine. Verify the install commands for the tool you pick.
- `--forwarded-allow-ips "*"` is acceptable **only** because the container is reachable only from `cloudflared` on a private network. Do not publish port 8000 to the host in production.
- Worker count: start at 2 times CPU cores plus 1 minus a margin for the Celery worker. Measure.
- Settings used at build for `collectstatic` must not require secrets (`prod_build` reads dummy values).
- Same image runs `api`, `worker` (`celery -A config worker -l info --concurrency=2`) and `beat` (`celery -A config beat -l info`) with different commands.

Static files: WhiteNoise serves Django admin and DRF static assets from the `api` container. The SPA is on Pages. Raw data and basemap are in R2.

## 6. `docker-compose.prod.yml` outline

Services: `api`, `worker`, `beat`, `db` (PostGIS, volume `pgdata`), `redis`, `cloudflared`.

Redis note: the broker must not evict keys, so run Redis with `maxmemory-policy noeviction` and give every cache key a TTL. If cache growth ever threatens the broker, split into two Redis instances (cache with `allkeys-lru`, broker with `noeviction`).

Rules:
- No service publishes a port to the host. `cloudflared` reaches `api` over the internal Docker network. `api`, `worker` and `beat` need outbound internet for data providers, the LLM and email.
- `restart: unless-stopped` on all services.
- Healthchecks: `api` hits `/api/v1/health/live/`, `db` uses `pg_isready`, `redis` uses `redis-cli ping`.
- Resource limits set per service.
- Logs use the `json-file` driver with `max-size` and `max-file`.
- `.env` file mounted with `env_file`.

## 7. CI/CD (GitHub Actions)

`backend-ci.yml` on pull request and push:
1. Services: PostGIS and Redis.
2. Install dependencies from the lockfile.
3. `ruff check`, `ruff format --check`, `mypy`.
4. `python manage.py makemigrations --check --dry-run`.
5. `pytest --cov` with the coverage gate from `testing.md`.
6. `python manage.py check --deploy --settings=config.settings.prod` with dummy env.
7. `pip-audit`.
8. `python manage.py spectacular --file schema.yml --validate` and upload the schema artifact.

`frontend-ci.yml`:
1. `pnpm install --frozen-lockfile`.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test --run`.
3. `pnpm build` and bundle size check against budgets.
4. `pnpm audit --prod`.
5. Playwright against a preview build with a mocked or seeded API for critical flows.
6. Check that generated API types are up to date (`pnpm api:generate` then `git diff --exit-code`).

`deploy-backend.yml` on push to `main` after CI passes:
1. Build the image, tag with the commit SHA, push to GitHub Container Registry.
2. SSH to the VPS (deploy key restricted to running `deploy.sh`).
3. `deploy.sh <sha>`: pull image, run `migrate` with `orca_migrate`, `collectstatic` is already in the image, restart `api`, `worker`, `beat`, wait for health, print status.
4. Smoke test: `GET /api/v1/health/ready/`, `GET /api/v1/data-status/`.
5. On failure: automatic rollback to the previous tag (step 9).

Pages deploys itself on push. Use preview deployments for pull requests.

Secrets in GitHub: `GHCR_TOKEN` (or use the built-in token), `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. No application secrets in GitHub. They live on the VPS.

## 8. Zero-downtime migrations

Single host with a short restart means "near-zero". To stay safe:
1. Follow expand and contract (`database.md`). The old code must work with the new schema.
2. Run `migrate` before restarting `api`. During the migration the old `api` keeps serving.
3. Restart `api` with `docker compose up -d --no-deps api`. Expect a few seconds of failed requests. The Cloudflare layer returns an error page. The SPA retries once and shows the retry state.
4. For longer windows, scale to two `api` containers behind the Tunnel (add a second `cloudflared` route or a local reverse proxy) and restart one at a time. Not needed at MVP scale.

## 9. Rollback

1. Application: `deploy.sh <previous-sha>`. Because migrations are backward compatible, the previous image works with the current schema.
2. Data: if a migration or bad ingestion corrupted data, restore from backup (`database.md`, section 8).
3. Frontend: in the Pages dashboard, roll back to a previous deployment.
4. Risk logic: set `RISK_OUTPUT_ENABLED=false`, restart `api`. Chat then returns advisories and data status only.
5. Rollback is rehearsed on staging before first launch and after any big change to the deploy process.

## 10. Secret rotation

| Secret | Steps |
|---|---|
| `SECRET_KEY` | Add new key, keep old in `SECRET_KEY_FALLBACKS` (Django 4.1+ feature, verify in current docs), deploy, remove old after sessions age out |
| DB passwords | Create new, update `.env`, restart, drop old |
| Turnstile secret | Rotate in dashboard, update `.env`, restart |
| LLM and data keys | Create new, update `.env`, restart, revoke old |
| Tunnel token | Rotate in Zero Trust, update `.env`, restart `cloudflared` |
| R2 tokens | Create new, update `.env`, restart, revoke old |

## 11. Staging

Mirror production on a smaller VPS (or a second Compose project on the same VPS if cost matters, with separate DB and Redis). Staging uses its own Turnstile widget, Access application, R2 bucket and Sentry environment. Ingestion runs at lower frequency. `seed_demo_data` is allowed.

## 12. Go-live checklist

- [ ] All items in section 3 done and recorded
- [ ] `check --deploy` clean
- [ ] Backup and restore tested end to end
- [ ] Rollback rehearsed
- [ ] Origin port scan shows no open web ports
- [ ] Access blocks a non-staff email on `/admin/`
- [ ] Risk thresholds reviewed by a named domain expert and recorded in `docs/risk-signoff.md`
- [ ] Privacy Policy and Terms reviewed by a qualified lawyer
- [ ] Uptime monitors and Sentry alerts confirmed by triggering a test
- [ ] Data licences recorded for every source
