# Security

## 1. What we protect

| Asset | Why it matters |
|---|---|
| Integrity of risk output | A wrong "safe" can put people in danger. This is the highest-impact asset. |
| User accounts and saved locations | Locations of home ports and landing sites are personal data. |
| LLM and data provider credentials and budget | Abuse causes cost and outage. |
| Availability during bad weather | Users need ORCA most when conditions are poor. |
| Admin access | Admin can edit sources, advisories and thresholds. |

## 2. Threat model (STRIDE summary)

| Threat | Example | Controls |
|---|---|---|
| Spoofing | Credential stuffing, fake Access JWT, forged `CF-Connecting-IP` | Turnstile, throttles, strong password rules, Access JWT validation, origin reachable only through Tunnel, trusted-proxy checks |
| Tampering | Edited thresholds, poisoned advisory data, prompt injection changing output | Thresholds in code under review, advisory source allowlist and content hash, rules engine decides risk, number validator on LLM text, audit log |
| Repudiation | Admin changes without trace | `AuditEntry` for sensitive actions, append-only |
| Information disclosure | Leaked sessions, PII in logs, IDOR on locations or threads | HttpOnly cookies, scoped querysets, UUID public IDs, log scrubbing |
| Denial of service | Chat flooding, expensive LLM calls | Cloudflare WAF and rate limits, DRF throttles, daily token budget, request size limits, timeouts |
| Elevation of privilege | Normal user reaches admin, guest accesses user data | Access in front of `/admin/`, permission tests, `is_staff` required, no admin API in frontend |

Specific risks for ORCA:
- **Prompt injection.** User text and ingested advisory text are untrusted. They go into prompts only inside delimited data blocks. The model has no tools that write data. Output is validated.
- **Stale or wrong data presented as fresh.** Mitigated by `unknown` state and visible data ages.
- **Scraped advisory source changes format.** Parser failure marks the source unhealthy and the risk engine treats advisories as missing, which yields `unknown`, not `safe`.

## 3. Session handling

Strategy: Django session auth, HttpOnly cookie. Details in `auth.md`.

| Setting | Value |
|---|---|
| `SESSION_COOKIE_HTTPONLY` | `True` |
| `SESSION_COOKIE_SECURE` | `True` in prod |
| `SESSION_COOKIE_SAMESITE` | `"Lax"` |
| `SESSION_COOKIE_DOMAIN` | `".orca.example"` in prod; unset in dev unless using `localtest.me` |
| `SESSION_COOKIE_AGE` | 14 days |
| `SESSION_ENGINE` | `django.contrib.sessions.backends.cached_db` |
| Session rotation | `login()` rotates the key; password change invalidates other sessions |

## 4. CSRF

- Django `CsrfViewMiddleware` stays on.
- `CSRF_COOKIE_DOMAIN=".orca.example"`, `CSRF_COOKIE_SECURE=True`, `CSRF_COOKIE_SAMESITE="Lax"`, `CSRF_COOKIE_HTTPONLY=False` (the SPA reads it).
- Frontend sends `X-CSRFToken` on `POST`, `PUT`, `PATCH`, `DELETE`.
- `CSRF_TRUSTED_ORIGINS=["https://app.orca.example"]`.
- `GET /api/v1/auth/csrf/` sets the cookie on first load.
- No state-changing `GET` endpoints.

## 5. CORS

`django-cors-headers`:
- `CORS_ALLOWED_ORIGINS=["https://app.orca.example"]` (plus staging origins in staging)
- `CORS_ALLOW_CREDENTIALS=True`
- `CORS_ALLOW_HEADERS` includes `content-type`, `x-csrftoken`, `idempotency-key`
- No wildcard origins. No regex origins in production.

## 6. Content Security Policy and headers

Frontend headers set in `frontend/public/_headers` (Cloudflare Pages). Verify syntax and any size limits in current Pages docs.

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://api.orca.example https://*.sentry.io; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Notes:
- `style-src 'unsafe-inline'` is needed by MapLibre inline styles. Revisit with nonces when feasible.
- PMTiles from R2 need the R2 public hostname in `connect-src`. Add it.
- `geolocation=(self)` because "Use my location" is a feature. It is requested only on user action.
- Sentry hostname depends on the DSN region. Set it from the real DSN.

API headers come from Django: `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_REFERRER_POLICY`, `X_FRAME_OPTIONS="DENY"`, and a minimal CSP for admin pages through `django-csp` (verify package and settings names for the current major version).

## 7. Production Django settings

```python
DEBUG = False
ALLOWED_HOSTS = ["api.orca.example"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False  # enable only after confirming all subdomains are HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
```

`python manage.py check --deploy` runs in CI against `config.settings.prod` with dummy env values. The build fails on any warning. Record the latest result in this file under "Deploy check log" after each release candidate.

### Deploy check log

| Date | Result | Notes |
|---|---|---|
| (fill in at first release candidate) | | |

## 8. Trusting Cloudflare headers (and not being spoofed)

`CF-Connecting-IP` is only trustworthy if the request really came through Cloudflare.

Primary design: **Cloudflare Tunnel**. The VPS has no public HTTP ports. `cloudflared` makes an outbound connection and forwards to the API container on the private Docker network. The only way to reach the API is through Cloudflare, so the header is set by Cloudflare. (Verify current Tunnel docs for setup and for how client IP is passed.)

Defence in depth in `core/cloudflare.py`:
1. A middleware reads `CF-Connecting-IP` only when `TRUST_CF_HEADERS=true`.
2. If the immediate peer address is not the `cloudflared` container network, the header is ignored and `REMOTE_ADDR` is used.
3. For deployments without Tunnel (fallback), the middleware also requires the peer IP to be in Cloudflare's published ranges (`https://www.cloudflare.com/ips-v4` and `/ips-v6`), refreshed weekly by a Celery task and cached. The origin firewall must also allow inbound 443 only from those ranges.
4. Never read `X-Forwarded-For` for client IP. Never trust `CF-Connecting-IP` in dev.

The resolved IP is stored as `request.client_ip` and used by throttles, audit log and logs.

## 9. Cloudflare Access for `/admin/`

- A Cloudflare Access self-hosted application covers `api.orca.example/admin/*`. Policy allows named staff emails only, with one-time PIN or the team's identity provider.
- Django verifies the `Cf-Access-Jwt-Assertion` header on every `/admin/` request in `AccessJwtMiddleware`:
  1. Fetch public keys from `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (cache 1 hour).
  2. Verify signature, `exp`, `iss` (team domain) and `aud` (the application's AUD tag).
  3. Reject with 403 on any failure. No bypass flag in production.
- After Access passes, Django admin login (username and password plus verified staff flag) is still required. Two layers.
- Verify JWT library choice (PyJWT with `cryptography`) and current Access claims in docs before coding.

## 10. XSS

- React escapes by default. `dangerouslySetInnerHTML` is banned without review.
- LLM output and advisory text render as plain text or through a minimal Markdown renderer that disallows raw HTML and restricts links to `https:`.
- CSP as above.

## 11. SQL injection

- ORM only. Raw SQL uses parameters. Reviewed in PR with the backend checklist.
- Geospatial queries use GeoDjango lookups, not string-built WKT.

## 12. Input limits

- Request body max 64 KB for JSON endpoints, enforced by `DATA_UPLOAD_MAX_MEMORY_SIZE` and Cloudflare rules.
- Chat message max 1,000 characters.
- Thread history sent to the LLM is capped to the last 10 messages.
- No file uploads at MVP.

## 13. Secrets management

- All secrets from environment variables. `.env` files are git-ignored. `.env.example` has names and fake values only.
- Production secrets live on the VPS in a root-owned `.env` file with `chmod 600`, injected by Docker Compose. CI secrets are in GitHub Actions encrypted secrets.
- Rotate on staff change and after any suspected leak. Rotation steps are in `deployment.md`.
- `gitleaks` (or equivalent, verify) runs in CI and as a pre-commit hook.

## 14. Dependency policy

- Backend: `pip-audit` in CI, fails on known vulnerabilities with a fix available. Lockfile committed.
- Frontend: `pnpm audit --prod` in CI, fails on high or critical. Lockfile committed.
- Dependabot or Renovate weekly PRs. Security updates reviewed within 3 days.
- New dependencies need a reason, maintenance check (recent releases, open issues), and licence check.
- Pin base Docker image tags and rebuild monthly.

## 15. Admin hardening

- Admin behind Access plus Django login.
- Custom `AdminSite` with the title "ORCA Admin" and a visible environment banner (production in red text).
- `ModelAdmin` classes list fields explicitly. `RiskAssessment`, `AuditEntry`, `Message` are read-only.
- Sensitive actions write an `AuditEntry`: user activate or deactivate, staff flag changes, advisory create or edit, data source enable or disable, manual ingestion trigger, account deletion.
- Staff accounts require a verified email. 2FA is provided by the Access identity provider.
- No superuser sessions on shared machines. Session age for staff is shorter (8 hours) through a middleware check.

## 16. Privacy by design

- Collect the minimum: email, display name, saved locations, chat text.
- Guest chats store a session key, not an IP. IPs are used for throttling in Redis only, with expiry.
- Chat location is stored as the point used for the assessment, rounded to 3 decimal places (about 100 m) in analytics and logs.
- Retention: guest threads deleted after 30 days. User threads kept until deleted by the user or the account. Soft-deleted threads purged after 30 days. Audit entries 12 months. Logs 30 days.
- Deletion: `delete_user` removes the user, threads, messages, locations and alert subscriptions, and anonymises audit entries (keeps action, removes actor link).
- Export: `export_user_data` produces JSON of everything held about a user.
- Details for the policy pages are in the Privacy Policy draft, which needs lawyer review.

## 17. Incident response (minimum)

1. Detect: Sentry alert, uptime alert, user report.
2. Contain: if risk output may be wrong, set the global `RISK_OUTPUT_ENABLED=false` flag. The app then shows a banner "ORCA risk ratings are paused. Use official advisories." and stops chat risk answers.
3. Fix and verify.
4. Notify affected users if personal data was exposed, within the legal timeline (DPDP Act obligations apply; confirm with counsel).
5. Write a short post-incident note in `docs/incidents/`.

## 18. Security checklist before launch

- [ ] `check --deploy` clean
- [ ] Access policy tested with a non-allowed email
- [ ] Origin not reachable except via Tunnel (port scan)
- [ ] Turnstile verified server-side on signup, login, reset
- [ ] Throttles verified with a load script
- [ ] CSP has no violations in a full manual walkthrough
- [ ] Secrets scan clean
- [ ] Backup restore tested
- [ ] `RISK_OUTPUT_ENABLED` kill switch tested
