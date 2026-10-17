# Authentication

## 1. Decision

**Django session authentication with HttpOnly cookies on a shared parent domain.** Not JWT.

Why:
- One first-party browser client. No native app, no third-party API consumers.
- HttpOnly cookies cannot be read by injected scripts. No token in `localStorage`.
- Server-side sessions can be revoked at once (logout everywhere, password change).
- No refresh-rotation logic to build and test.

Cost: needs a shared parent domain and CSRF handling. Both are in place:
- `app.orca.example` (SPA) and `api.orca.example` (API) share `.orca.example`.
- Requests are same-site, so `SameSite=Lax` cookies are sent.

If a native mobile app or public API is added later, add SimpleJWT for those clients only. Do not mix on the same endpoints.

## 2. Components

| Piece | Where |
|---|---|
| Custom `User`, email as `USERNAME_FIELD` | `apps/accounts/models.py` |
| Auth endpoints | `apps/accounts/views.py` under `/api/v1/auth/` |
| Turnstile verification | `apps/accounts/turnstile.py` |
| Email verification token | Django `signing.TimestampSigner`, 24 h, single use tracked by `is_email_verified` |
| Password reset token | Django `PasswordResetTokenGenerator` |
| Throttles | `apps/accounts/throttles.py` |
| Frontend forms | `frontend/src/features/auth/` |

## 3. Turnstile

Frontend: render the Turnstile widget (script from `https://challenges.cloudflare.com/turnstile/v0/api.js`, allowed in CSP). Send the response token as `turnstile_token` in the request body.

Backend `verify_turnstile(token, ip)`:
1. `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with form fields `secret`, `response`, and `remoteip`.
2. Require `success == true`. Optionally check `hostname` matches the expected app hostname.
3. Timeout 3 seconds. On network failure, **fail closed** (reject with `turnstile_unavailable`, status 503). Production must not skip verification.
4. Tokens are single-use. A second use returns failure.

Applied to: signup, login, password reset request, resend verification, and guest chat when a guest has used more than half of their hourly quota (the frontend then shows the widget).

Test keys: use the dummy site and secret keys published in Cloudflare's Turnstile testing docs. Verify them there. Do not hard-code in source. Put them in `.env.example`.

## 4. Flows

### 4.1 Signup

1. User opens `/signup`. Frontend calls `GET /api/v1/auth/csrf/`.
2. Form fields: email, display name, password, Turnstile.
3. `POST /api/v1/auth/signup/`.
4. Backend: verify Turnstile, validate with Django password validators (min length 10, not common, not numeric only, not similar to email), create user with `is_email_verified=False`, send verification email (Celery task).
5. Response is always `201 {"detail": "Check your email to verify your account."}`, **including when the email already exists** (then the email sent says an account exists and links to login). This avoids account enumeration.
6. Frontend shows the "Check your email" screen with a resend button (cooldown 60 s).

### 4.2 Email verification

1. Email link: `https://app.orca.example/verify-email?token=<signed>`.
2. Frontend posts `POST /api/v1/auth/verify-email/ {token}`.
3. Backend unsigns (max age 24 h), sets `is_email_verified=True`.
4. Success: frontend redirects to `/login` with a message. Expired or invalid: shows an error with a resend option.
5. Verification does not log the user in.

### 4.3 Login

1. `POST /api/v1/auth/login/ {email, password, turnstile_token}`.
2. Backend: verify Turnstile, apply throttles, authenticate. Same error for wrong email and wrong password (`invalid_credentials`).
3. If `is_email_verified` is false: respond `403 email_not_verified` and re-send nothing automatically.
4. On success: `django.contrib.auth.login()` (rotates the session key), return the user body. Cookies set by Django.
5. Frontend invalidates `me`, then navigates to `next` (validated) or `/dashboard`.

Lockout: after 5 failed attempts for one email in 15 minutes, further attempts for that email return `429 rate_limited` for 15 minutes regardless of the password. Throttle by IP as well.

### 4.4 Logout

`POST /api/v1/auth/logout/` calls `logout()` (flushes the session). Frontend clears the Query cache and the service worker's cached API responses (via `postMessage` to the SW), then navigates to `/`.

### 4.5 Password reset

1. `/forgot-password`: email + Turnstile, `POST /api/v1/auth/password-reset/`.
2. Always `200` with the same message, whether or not the account exists.
3. If it exists and is active: email with `https://app.orca.example/reset-password?uid=<b64>&token=<token>`. Token validity 1 hour (`PASSWORD_RESET_TIMEOUT=3600`).
4. `/reset-password`: new password, `POST /api/v1/auth/password-reset/confirm/ {uid, token, new_password}`.
5. On success: all sessions for that user are deleted, the user is sent to `/login`. Verified-email flag is set true (they proved inbox control).

### 4.6 Password change (signed in)

`POST /api/v1/auth/password-change/ {current_password, new_password}`. On success, `update_session_auth_hash` keeps the current session, other sessions are removed.

### 4.7 Session expiry handling

- Sessions last 14 days from last login. No sliding extension at MVP.
- On expiry, API returns `401 not_authenticated`. The frontend client clears state and redirects to `/login?next=<current path>` with the message "Your session ended. Sign in again."
- Unsaved form data in a long form is kept in `sessionStorage` for the draft case only for the location form.
- Staff sessions on admin expire after 8 hours.

### 4.8 Account deletion

`DELETE /api/v1/me/ {password}` after re-entering the password. Backend runs the deletion service (see `security.md` section 16), logs out, returns `204`.

### 4.9 Guest sessions

- Guests have an anonymous Django session created on first chat message. Cookie is the same session cookie.
- Guests get a smaller quota and cannot save locations or alerts.
- On signup or login, guest threads in that session are claimed by the user if the user opts in (`claim_guest_threads=true` in the login or signup body).

## 5. Protected routes

### Backend
- Default permission class `IsAuthenticated`.
- Public endpoints explicitly listed in `api.md`: health, data status, auth entry points, csrf, schema (non-prod or Access-protected), chat (guest allowed), risk read (guest allowed, tighter throttle).
- Querysets scoped to `request.user`.
- Unverified users cannot call authenticated endpoints. A permission class `IsVerified` is part of the default.

### Frontend
- `RequireAuth` route guard (see `frontend.md`). It is a convenience. The server is the authority.
- The sidebar shows only links the user can use.

## 6. Cloudflare Access for admin

See `security.md` section 9. Summary: Access policy on `api.orca.example/admin/*`, JWT verified by `AccessJwtMiddleware`, then Django staff login. Staff are created only with `createsuperuser` or by another superuser through admin.

## 7. Rate limiting summary

| Endpoint | Per IP | Per account or email |
|---|---|---|
| signup | 5 / hour | n/a |
| login | 10 / hour | 5 / 15 min per email |
| password reset request | 5 / hour | 3 / hour per email |
| resend verification | 5 / hour | 3 / hour per email |
| verify email, reset confirm | 20 / hour | n/a |

Cloudflare WAF rate rules add a second layer. Numbers are starting values.

## 8. Cookies used

| Cookie | Purpose | Category | Flags |
|---|---|---|---|
| `sessionid` | session | essential | HttpOnly, Secure, SameSite=Lax, Domain=.orca.example |
| `csrftoken` | CSRF | essential | Secure, SameSite=Lax, Domain=.orca.example |
| `cf_clearance` or Turnstile-related | set by Cloudflare when applicable | essential (security) | set by Cloudflare |
| `orca_consent` | stores consent choice | essential | Secure, SameSite=Lax |

`localStorage` keys: `orca.theme`, `orca.units`, `orca.highscore`, `orca.consent`. No auth data.

## 9. Local development notes

- Use `app.localtest.me` and `api.localtest.me` so both share the registrable domain `localtest.me`. Set `SESSION_COOKIE_DOMAIN=".localtest.me"` and `CSRF_COOKIE_DOMAIN=".localtest.me"` in `dev.py`.
- `Secure` cookies are off in dev (`http`).
- `localhost` for both apps will not share cookies in the same way. Do not use it.
- Verification and reset emails print to the console in dev.

## 10. Test checklist

- [ ] Signup with existing email returns same response as new email
- [ ] Unverified login returns `email_not_verified`
- [ ] Login rotates session key
- [ ] Wrong password and unknown email return identical errors and similar timing
- [ ] Expired and reused tokens rejected
- [ ] Password reset invalidates other sessions
- [ ] CSRF required on every unsafe method
- [ ] Turnstile failure and Turnstile outage both block
- [ ] Throttles trigger at the documented thresholds
- [ ] Admin without valid Access JWT returns 403
