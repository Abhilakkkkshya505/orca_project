# TASK 5 of 6: The complete website (every page, scrolling, wave animation, legal, errors)

Paste after the CONTEXT BLOCK. Do Tasks 0 to 4 first.

```
TASK 5: Build every page with real content and real data, fix scrolling, add data-driven wave animation, legal pages, and proper error handling. Follow docs/design.md and docs/frontend.md. Do not use mock data in components: every number comes from the API or is a clearly labelled loading, empty or error state.

---------------------------------------------------------------------
PART A: FOUNDATION FIXES (do these first)
---------------------------------------------------------------------
A1. SCROLLING BUG HUNT. Search all CSS, Tailwind classes and layout components for: `overflow: hidden` or `overflow-hidden` on html, body, #root or page wrappers; `h-screen` or `height: 100vh` on page wrappers; `position: fixed` wrappers that trap content; `touch-action: none` outside the map canvas; a map container swallowing wheel and touch events across the whole page. Fix so that:
    - html and body scroll normally; only the map canvas and the chat message list scroll internally;
    - `min-h-dvh` (not fixed height) for page shells; `100dvh` only for the explore workspace;
    - `scroll-padding-top` equals the sticky header height, so anchors are not hidden;
    - the map has `cooperativeGestures` (two-finger pan on touch, Ctrl + wheel on desktop) on pages where the map sits inside a scrolling page, so the page can scroll past it; on /explore the map is full-height and gestures are normal;
    - iOS address bar and keyboard do not cut off the composer (use `visualViewport` where needed).
    Prove it with Playwright at 320, 768 and 1440 px: scroll the page, measure scrollY changes, assert no horizontal scroll (scrollWidth <= clientWidth).
A2. Delete any hardcoded default location from the frontend. The app never assumes a place. With no place selected, the map shows the world or India overview and a PlacePicker.
A3. Tokens: implement docs/design.md colours as CSS variables (light, dark, risk tokens), Tailwind mapped to them. No raw hex in components (ESLint rule or a test that greps).
A4. Libraries (verify names and versions before adding): charts with a small, accessible option (recharts, uPlot or visx; justify and watch the bundle budget), date handling with Intl and a tiny helper (no moment), icons lucide-react, class handling clsx, headless primitives (Radix UI) for dialog, popover, tabs, tooltip, dropdown, toast.

---------------------------------------------------------------------
PART B: ROUTES AND PAGE SPECS
---------------------------------------------------------------------
Every route below must exist, render real content, have loading, empty and error states, and pass at 320 px, 768 px and 1440 px, light and dark.

PUBLIC
/ (Landing). A real long page. Sections in order, each with a real purpose and no filler:
   1. Hero: left-aligned headline stating what ORCA does ("Is it safe to go out? Ask about any port."), one sentence, a PlacePicker with a primary button "Check conditions", and the SeaState visual driven by a LIVE sample port. The sample port is picked from a small list of real ports in different regions (for example Mumbai, Chennai, Visakhapatnam, Mangaluru, Kolkata, Kandla, Port Blair, Colombo) via GET /ports/ with current_level; rotate every 12 seconds if the user has not interacted; always show the port name, level badge, wave height, wind, valid window and data age. If the API fails: calm flat line and "No recent data".
   2. "Ask in plain words": a REAL example conversation rendered from a real API call at build or load time, or an interactive one-click example that opens /explore with the question prefilled. Never a fake transcript.
   3. How it works: the five agents (weather, ocean state, satellite, fishing zones, advisories) as a vertical flow with one honest sentence each, and a box titled "Who decides safety": the rules engine, not the AI.
   4. The four levels: Safe, Caution, Unsafe, Unknown with icon + word + colour and what each means. Make "Unknown" prominent: "ORCA says unknown when data is missing or old. It never guesses safe."
   5. Coverage: live numbers from /ports/coverage/ (count-up animation), a search box, and a list of India states with port counts linking to /ports?state=...
   6. Works with poor signal: explain the offline page, cached advisories, and the game; link to /game.
   7. Data and honesty: list of real sources with their data age from /data-status/, a "What ORCA does not do" list, and the sentence "Official IMD and INCOIS warnings override ORCA."
   8. SDG 14: short section on how this supports life below water, with sourced facts only (cite UN SDG 14 targets; no invented statistics).
   9. FAQ: only questions answered on the page, using accessible disclosure components.
  10. Footer: links (Privacy, Terms, Accessibility, Methodology, Status, About, GitHub if provided), attribution block, "Demo values" note if ENVIRONMENT is not production.
   No fake testimonials, fake counts, fake logos, stock illustrations, centred gradient hero, or three-identical-card grids (see docs/ignore.md).
/explore  Chat and map workspace from Task 3. Two-pane on md and up; tabs (Chat | Map) on mobile that preserve scroll and state.
/ports  Directory: search with debounce and keyboard navigation, filters (country, state, type, coastal only), sort (name, distance if location granted, level), pagination with count, each row shows name, country, state, type and a current level badge when available. Empty state: "No ports match. Try a different spelling or clear filters." A "Use my location" button sorts by distance (permission requested only on click).
/ports/:slug  Port page:
   - header: name, country, state, type, coordinates, "Sea data measured X km from port" if offset above 5 km;
   - RiskCard for now and a window selector (next 12 h, today, tomorrow, 48 h) and vessel class toggle;
   - SeaState visual driven by this port;
   - 48-hour charts for wave height, swell, wave period, wind and gusts, rain, with the caution and unsafe thresholds drawn as labelled lines and a "development values" note; an accessible data table toggle under each chart;
   - active advisories list;
   - fishing zones list and mini-map with origin and model version labels;
   - chlorophyll anomaly note if flagged;
   - nearby ports;
   - "Ask ORCA about this port" button opening /explore with the port prefilled;
   - "Save this location" (login prompt if guest).
   Handle: unknown level, inland port, stale data, no advisories, provider down.
/compare?ports=a,b,c  Side-by-side comparison of up to 3 ports (levels, key factors, charts overlay).
/how-it-works and /methodology  How risk is computed, factor list and units, thresholds table (marked development values with sources from docs/risk-thresholds-sources.md), data sources with live freshness, the ML models from /models/ with real metrics and limits, glossary (significant wave height, swell, gust, Beaufort, sea state).
/privacy  /terms  /accessibility  /about  /status (live data-status table) 
/login /signup /verify-email /forgot-password /reset-password
/game  The fish game as a normal page (shared code with the offline page).
/offline-preview  Shows the offline page for testing (dev only).
404  Catch-all route with a real 404 page: helpful text, search box for ports, links to Explore, Ports and Home. Returns proper behaviour on prerendered hosts (document it).
/error  and a route-level ErrorBoundary page: what happened, a retry button, copy-able error id (request id if known), link home. Distinct states for: network error (offline detector), 5xx, 429 (with retry time), 401 expired session (redirect to login with next), 403.
SIGNED IN
/dashboard  overview cards (saved ports with current levels and top factor, active advisories count, alerts active, data freshness), a "needs attention" list sorted by risk, the SeaState for the first saved port, recent chats.
/locations  CRUD with PlacePicker (ports and map click), edit name and kind, delete with confirmation, max 20 with a clear message.
/alerts  subscriptions per location with minimum level, enable/disable, last notified.
/advisories  the primary data table: server-side sort, filter (severity, source, near me, saved only, text search), pagination, row expand, aria-sort, keyboard operable, stacked cards on narrow screens.
/settings  profile, units (metric or knots), default vessel class, theme (light, dark, system), language (English now, structure ready), password change, data export, account deletion with password re-entry.

---------------------------------------------------------------------
PART C: LEGAL AND TRUST CONTENT (real text, not placeholders)
---------------------------------------------------------------------
C1. PRIVACY POLICY, tailored to ORCA. Sections: who we are and contact placeholder, what data we collect (email, display name, password hash, saved locations, chat text, approximate location only if the user grants browser location and only for the request, session and CSRF cookies, server logs with request IDs, abuse-prevention data via Cloudflare Turnstile), why and legal bases, who processes it (hosting provider, Cloudflare, email provider, LLM provider if enabled, data providers receive only coordinates of requested ports or points and never user identity), cookies table with name, purpose, duration, category, retention periods (match docs/security.md), user rights under GDPR, CCPA and India DPDP (access, correction, deletion, portability, withdrawal of consent, grievance contact), children, international transfers, security measures, changes, effective date. Include a clearly visible note: "This is a draft and must be reviewed by a qualified lawyer before public use."
C2. TERMS AND CONDITIONS: service description, ORCA is decision support and NOT an official warning service, SAFETY DISCLAIMER section (no guarantee, official IMD/INCOIS/Coast Guard warnings override, user remains responsible for the decision to go to sea, do not rely on ORCA as the sole source), acceptable use, accounts, rate limits, data sources and third-party terms (Open-Meteo non-commercial, Global Fishing Watch non-commercial, Copernicus, NOAA, OpenStreetMap), intellectual property, disclaimers and limitation of liability, termination, governing law placeholder, changes, contact. Same lawyer-review note.
C3. WIRING: Login page shows "By signing in you agree to the Terms and Privacy Policy" with both linked. Signup has a REQUIRED checkbox "I agree to the Terms and the Privacy Policy" with both linked (open in new tab). The API rejects signup without `accepted_terms=true` and stores `terms_version` and `accepted_at`. Footer on every page links Privacy, Terms, Accessibility. Chat composer footnote links Terms and shows "Official warnings override ORCA."
C4. Consent banner only if a non-essential cookie or analytics is added. If none is used, do not show a banner and state this in the Privacy Policy cookie table.
C5. Accessibility statement page: target WCAG 2.2 AA, known issues, contact.

---------------------------------------------------------------------
PART D: WAVE ANIMATION (purposeful, data-driven)
---------------------------------------------------------------------
docs/ignore.md bans RANDOM decorative waves. Add this exception in docs/ignore.md and docs/design.md in the same commit: "Data-driven sea-state animation is allowed when it reflects real forecast values, is labelled, and respects reduced motion."
D1. Component <SeaState waveHeightM wavePeriodS swellHeightM swellPeriodS windKmh status />.
    - Draw 3 layered SVG wave paths (back swell, mid, front wind-wave). Animate with CSS transforms or SMIL-free requestAnimationFrame on transform only (GPU friendly; no layout thrash).
    - Amplitude mapping: ampPx = clamp(containerHeight * 0.08 * (H^0.7), 2, containerHeight * 0.35) where H is wave height in metres; wavelength proportional to period; scroll duration derived from the real period (for example duration = clamp(period, 3, 14) seconds). Document the formula in a code comment that explains the intent.
    - Show the WMO sea state description (Calm glassy, Calm rippled, Smooth, Slight, Moderate, Rough, Very rough, High, Very high, Phenomenal) computed from wave height with the boundaries from the WMO sea state (Douglas) scale (confirm the table from an official source and cite it in docs/design.md).
    - A small boat or buoy bobbing with vertical motion proportional to H and phase locked to the front wave.
    - Caption: "Illustrative, not to scale. Based on forecast wave height 1.8 m and period 8 s for Mumbai, valid 14:00, data 1 h old." If data is missing: a flat line, no boat motion, caption "No recent data."
    - Colours: water tokens only; no gradients; no glow.
    - prefers-reduced-motion: render a static frozen wave with the same amplitude, no animation. A "Pause animation" control is available for everyone.
    - Pause when offscreen (IntersectionObserver) and when the tab is hidden.
D2. Use SeaState in: landing hero, port page header, risk card header (compact), dashboard first saved port, status of the offline page (static).
D3. Other motion (all disabled under reduced motion): scroll-reveal for sections (200 ms fade and 12 px rise, IntersectionObserver, no re-trigger), count-up for coverage numbers (once), button and card hover and focus transitions (120 ms), page transition (150 ms cross-fade, not blocking), animated skeletons without shimmer when reduced motion, streaming text without per-letter animation, map layer fade-in.
D4. Performance: animation runs at 60 fps on a mid-range phone; SeaState is lazy loaded below the fold; add a unit test and a Playwright performance smoke check that the main thread is not blocked for more than 50 ms by the animation.

---------------------------------------------------------------------
PART E: NAVIGATION, STATE AND ACCESSIBILITY
---------------------------------------------------------------------
E1. Header: logo, Explore, Ports, How it works, theme toggle, Login or account menu; mobile menu with focus trap and Escape to close. Skip link first. Footer as in C3. Breadcrumbs on port pages.
E2. Theme: light, dark, system, persisted (guarded storage), applied before first paint to avoid flash; map style follows.
E3. Units toggle (metric/knots) applied everywhere through lib/format.ts, including charts and the chat.
E4. i18n: all strings through t(); English resource files per namespace; date, number and unit formatting through Intl. Language switcher hidden until a second language exists, but the structure must be ready.
E5. Accessibility per docs/accessibility.md: landmarks, one h1, heading order, focus management on route change, live region for status, risk never by colour alone, 44 px targets, visible focus, charts have table alternatives, map has a text equivalent and keyboard controls.
E6. SEO per docs/seo.md for public pages: titles, descriptions, canonical, Open Graph with a real generated image per port is OPTIONAL; at least a generic OG image; robots.txt, sitemap.xml including port pages (generate from /ports/ at build, capped at a sensible count with sitemap index if large), noindex on auth and app pages, JSON-LD on landing. Prerender landing and legal pages (verify approach).

---------------------------------------------------------------------
PART F: TESTS AND VERIFICATION
---------------------------------------------------------------------
F1. Vitest: format utilities (units, rounding, timezones, "No data"), SeaState mapping (amplitude, period, WMO class boundaries, flat line when null, reduced motion), RiskBadge and RiskCard for all four levels, Zod schemas, route guard `next` sanitising, signup requires the terms checkbox, theme toggle persistence, PlacePicker keyboard behaviour, table sorting and filter state in the URL.
F2. Playwright (Chromium desktop + mobile viewport; WebKit and Firefox smoke on landing and login):
    - every route renders without console errors (assert none);
    - scroll test at 320, 768, 1440 px; no horizontal overflow; footer reachable by scrolling;
    - landing sample port rotates among different ports, and the data on screen changes;
    - search "mumbai" and "cochin" in /ports and open each port page; charts and RiskCard show different values;
    - unknown route shows the 404 page; force a 500 from the API with route interception and see the error state with retry; offline during navigation shows the offline page;
    - signup blocked without the checkbox; Privacy and Terms links on login, signup and footer open the right pages;
    - reduced motion emulation: SeaState has no animation; theme switch; keyboard-only run through landing, login, ports search and the chat;
    - axe has no serious or critical violations on every page in light and dark.
F3. Screenshots: save a full-page screenshot of every route at 390 px and 1440 px, light and dark, to docs/screenshots/. Reference them in docs/ANALYSIS or the README.
F4. Bundle budgets per docs/performance.md; print sizes. Lighthouse mobile on /, /ports and /ports/mumbai-in with LCP, CLS, INP (lab proxy), and fix regressions.

scripts\verify-task5.ps1 prints PASS or FAIL for: lint, typecheck, unit tests, build, route table (every route and status), scroll checks, 404 and error pages, SeaState on landing, port page and risk card reacting to data, legal links on login/signup/footer, accept-terms enforcement (UI and API), axe, bundle sizes, Lighthouse scores. Run it and paste the full output.
```
