# TASK 6 of 6: Offline, PWA, game, security, deployment files and final QA

Paste after the CONTEXT BLOCK. Do Tasks 0 to 5 first.

```
TASK 6: Make offline mode, the game and the PWA real; harden security; produce deployment files and docs; run a full regression and an honest final audit.

---------------------------------------------------------------------
PART A: PWA AND OFFLINE
---------------------------------------------------------------------
A1. Manifest: name, short_name, start_url "/explore", display standalone, theme and background colours from tokens, icons 192, 512 and a maskable 512 (generate real icons from an SVG logo you design; no stock art), screenshots optional, shortcuts for "Check my ports" and "Ask ORCA". Verify installability with Lighthouse and show the result.
A2. Service worker (vite-plugin-pwa with injectManifest; verify the options in its docs):
    - Precache: app shell, fonts, icons, offline.html and its script and styles, the game assets.
    - Navigation: network first with a 3 second timeout, then cached shell, then offline.html.
    - GET /api/v1/risk/, /ports/, /ports/{slug}/, /advisories/, /dashboard/overview/, /data-status/: network first with a 4 second timeout, then cache; the SW adds `x-orca-cached: true` and `x-orca-cached-at` so the UI can show "Saved 3 h ago". Cached risk older than 12 hours is shown with a STALE banner and level displayed as unknown, never as the old level (safety rule S2).
    - Never cache: POST, auth endpoints, the chat stream, /admin/, responses with Set-Cookie.
    - PMTiles range requests: cache-first for tiles already fetched, with a size cap and eviction.
    - Max entries and max age per cache; versioned cache names; delete old caches on activate.
    - On logout the page sends the SW a message to clear user-scoped API caches.
    - Update flow: "New version available" banner with a Reload button; never reload automatically mid-form.
A3. The standalone offline page (offline.html + offline.js, no framework, under 30 KB gzip):
    - Heading "You are offline", a short plain explanation, a Try again button, and a status line that detects reconnection (ping /api/v1/health/live/ every 5 seconds with backoff; use the `online` event only as a hint) and then returns the user to the page they were on.
    - "Last saved conditions": read the SW cache and show up to 5 recently viewed ports with level, window, data age and the stale rule above. If nothing is cached: "No saved ports yet."
    - A "Play while you wait" game section (below).
    - Works with zero network, in light and dark, at 320 px.
A4. THE FISH GAME (single canvas, no library; shared code in frontend/src/offline/game/ used by both the offline page and /game):
    - Setting: underwater sea. A fish swims; collects food pellets (+1) and bubbles (+3, rarer); avoids jellyfish (sinusoidal drift), fishing nets (vertical hazard that sweeps), and sharks (fast horizontal). Hazards are distinguishable by SHAPE and motion, not colour alone.
    - Score, best score (localStorage with try/catch; works if storage is blocked), lives (3) or one-hit mode toggle, difficulty ramp (spawn rate and speed increase every 20 seconds up to a cap), combo for consecutive pickups, game over screen with Restart.
    - Controls: keyboard (arrows or WASD to move, Space or P to pause, R to restart), touch (drag the fish or on-screen joystick buttons), and pointer follow on desktop. Auto-pause on tab hidden and window blur.
    - Engine: fixed time step (60 Hz update, decoupled from render), delta clamped, object pooling, no per-frame allocation in the hot loop, a single requestAnimationFrame loop, devicePixelRatio aware canvas sized by ResizeObserver, pixel snapping, sprites drawn from cached Path2D or a tiny spritesheet. Target 60 fps on a mid-range phone; print measured fps from a Playwright run.
    - Reduced motion: "Calm mode" on by default when prefers-reduced-motion: fewer particles, slower hazards, no shake, no flash. Everyone can toggle it.
    - Accessibility: canvas has role="img" with an aria-label that says it is an optional game; all controls reachable by keyboard; score announced politely every 5 points and at game over; the game is optional and the page works without it.
    - Sound: none by default; if you add sound, it is off until the user turns it on, and respects a mute toggle.
    - Logic is pure functions (movement, collision with circle and rectangle tests, spawn scheduler with a seeded RNG, scoring) with unit tests, including: edge collisions, pause/resume timing, high-score write failure, difficulty cap, deterministic replay with a seed.
A5. Offline tests (Playwright): load the app online, visit two port pages, set the context offline, reload, see offline.html with those two ports listed with ages; play a round using the keyboard and again with touch emulation; go online and see automatic return within 10 seconds; confirm a stale cached risk shows unknown with the STALE banner; confirm logout clears cached user data.

---------------------------------------------------------------------
PART B: SECURITY AND PRIVACY HARDENING
---------------------------------------------------------------------
B1. Run `python manage.py check --deploy --settings=config.settings.prod` with dummy production env values; fix every warning; record the result in docs/security.md.
B2. Auth: re-run the full checklist in docs/auth.md as automated tests (signup enumeration safety, verification, login rotation, lockout, reset invalidates sessions, CSRF on all unsafe methods, Turnstile failure and outage fail closed, throttles at documented limits, terms acceptance stored).
B3. Permission matrix: generate tests from docs/api.md so EVERY endpoint is tested for anonymous, guest session, unverified user, verified owner, other verified user, staff. Print a coverage table: endpoint count vs endpoints tested; it must be 100 percent.
B4. Cloudflare helpers: `CF-Connecting-IP` trusted only per docs/security.md (behind the tunnel network or from Cloudflare ranges), spoofing tests with forged headers; Access JWT middleware tests with generated keys (valid, expired, wrong aud, wrong iss, bad signature, missing header); `DEV_BYPASS_ACCESS` refuses to load in production.
B5. Headers and CSP: add _headers for Pages and Django security headers; walk every page in Playwright with the CSP active and assert zero CSP violations (collect `securitypolicyviolation` events). MapLibre, Turnstile and Sentry hosts allowed explicitly.
B6. Dependency and secret scans: pip-audit, pnpm audit --prod, gitleaks (or detect-secrets; verify), and a grep for key-like strings in the repo and git history. Report honestly, including unfixed items and why.
B7. Privacy: logs contain no emails, tokens, session ids or precise coordinates (assert with a log-scrubbing test); `export_user_data` and `delete_user` tested end to end, including that deletion removes threads, messages, locations, alerts and anonymises audit entries; retention jobs tested.
B8. Abuse and limits: request size caps, chat length cap, thread history cap, SSE connection cap per IP, geocode and on-demand fetch rate limits, LLM daily budget.
B9. Prompt-injection and number-validator regression suite from Task 3 runs in CI.

---------------------------------------------------------------------
PART C: INFRA, CI AND DEPLOYMENT FILES
---------------------------------------------------------------------
C1. Production Dockerfile (GDAL, GEOS, PROJ, non-root, uvicorn with proxy headers), docker-compose.prod.yml (api, worker, beat, db with PostGIS, redis with noeviction, cloudflared, no published ports, healthchecks, resource limits, log rotation), infra\cloudflared\config.example.yml, infra\scripts\backup.sh / restore.sh / deploy.sh and PowerShell versions where sensible. Test the production compose file locally with a self-contained profile (no Cloudflare), proving the stack boots with prod settings and dummy env.
C2. GitHub Actions: backend-ci, frontend-ci, deploy-backend per docs/deployment.md, including check --deploy, migrations check, OpenAPI schema validation and generated-types diff, bundle budgets, Playwright, pip-audit and pnpm audit, secret scan. Validate the YAML syntax (actionlint if installable; verify) and print the result.
C3. docs/MANUAL_SETUP.md: an ordered checklist of everything the owner must do by hand with exact values and the env variable each goes into: domain and Cloudflare zone, Pages project, Tunnel and token, Access application and AUD tag, real Turnstile widget and keys, WAF and rate-limit rules, R2 buckets and tokens, VPS purchase and hardening, email provider and SPF/DKIM records, Sentry projects, Copernicus, GFW, CDS and LLM keys, MapTiler or PMTiles hosting, GitHub secrets, uptime monitors.

---------------------------------------------------------------------
PART D: DOCS THE OWNER CAN SUBMIT
---------------------------------------------------------------------
D1. README.md with exact Windows commands from a clean clone to a running site, tested on a fresh clone in a temp folder (paste the transcript).
D2. docs/CODE_WALKTHROUGH.md: a LINE-BY-LINE explanation, in plain language, of the most important files: risk/rules.py and thresholds.py, agents/validators.py, the rule-based parser and place resolver, orchestrator, the SSE chat view, ports search and nearest queries, orca_ml features.py and fishing_zone training script and serve path, the adoption gate loader, Turnstile verification, core/cloudflare.py, auth views, frontend useChatStream and the SSE parser, SeaState, the API client, the service worker, and the game loop. For each file: a short snippet, then a block-by-block explanation of what each line does and why it is written that way, and what would break if it were removed.
D3. docs/PROJECT-REPORT.md: a concise project report for the Sustainability course: problem and SDG 14 link, users, solution, architecture diagram (Mermaid), data sources with attribution, safety design (rules engine, unknown state, validator), the ML models with REAL metrics and gate results from Task 4, limitations and ethics (AIS bias, development thresholds, no official status), impact and evaluation plan, future work, references with URLs. Use only facts that are true of what was built. Mark anything unverified.
D4. docs/DEMO-SCRIPT.md: a 5-minute demo script with exact clicks and example questions using different ports, including the offline moment and one "unknown" example that shows honesty.
D5. Update CHANGELOG.md and docs/api.md; regenerate the OpenAPI schema and frontend types.

---------------------------------------------------------------------
PART E: FULL REGRESSION AND HONEST FINAL AUDIT
---------------------------------------------------------------------
E1. Re-run verify-task0 through verify-task5. All must pass. Create scripts\verify-all.ps1 that runs them in order and prints one summary table.
E2. Run the entire backend suite, frontend suite and Playwright suite; print pass counts, skipped counts (each skip with a reason) and coverage numbers. Risk engine must show 100 percent branch coverage.
E3. Browser walkthrough with screenshots saved to docs/screenshots/walkthrough/: as a guest ask about 5 different ports (including one inland and one ambiguous name); view a port page and the compare page; sign up (with the terms checkbox), verify via the dev mail sink, log in; save 3 ports; create an alert; open the dashboard and the advisories table; change units and theme; log out; go offline; play the game; reconnect.
E4. Repo hygiene scan, with counts: banned words from docs/ignore.md, lorem ipsum, TODO and FIXME, console.log, print( in backend apps, `any` in TypeScript, hardcoded Kochi or default coordinates, missing alt text, raw hex in components, components over 200 lines, unused dependencies. Fix what you find or list it.
E5. Write docs/FINAL-AUDIT.md: a table of EVERY route and endpoint (exists, works, tested, notes), every model (status, gate result), every provider (status), every safety rule S1 to S10 with the test that proves it, and a candid list of known gaps. If something is not done, say NOT DONE. Do not round up.

---------------------------------------------------------------------
FINAL REPORT
---------------------------------------------------------------------
Use the reporting format from the CONTEXT BLOCK. Add: exact local run commands for Windows; the list of manual steps left for the owner (point to docs/MANUAL_SETUP.md); the three biggest risks you see in the project; and which parts you would NOT trust yet and why.
```
