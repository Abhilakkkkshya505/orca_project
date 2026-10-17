# Roadmap

Scope is cut hard. The core of ORCA is **ask a question, get a rated answer on a map, with the data age shown**. Everything else is secondary.

## Principles for cutting scope

1. Safety honesty before features. A narrower product that says `unknown` correctly beats a wide one that guesses.
2. Ingest less data, better. Start with waves, wind, rain and official advisories. Add satellite layers after the core works.
3. One region first (a defined stretch of the Indian coast), then widen the bounding box.
4. No feature ships without its tests, its empty, loading and error states, and its doc update.

## MVP (target: demo-ready, not for unsupervised real-world reliance)

**In scope**
- Guest and signed-in chat with streaming answers
- Deterministic risk engine with `safe`, `caution`, `unsafe`, `unknown`
- Data ingestion: Open-Meteo marine and weather, one ocean product for SST and chlorophyll from Copernicus Marine (if access is confirmed), advisories from one official source with a documented access method
- Fishing zones: official PFZ advisory when available, otherwise a simple SST front and chlorophyll heuristic, clearly labelled
- Map with location marker, zone layer, advisory areas (vector only)
- Auth: signup, verify email, login, logout, password reset, Turnstile, throttling
- Dashboard: saved locations with current level, active advisories count, data freshness, advisories table with server-side sort, filter and pagination
- Saved locations (max 20) and email alerts for level changes
- Settings and profile, account deletion and data export command
- PWA with offline page, fish game, cached last advisory
- Landing page, 404, privacy policy and terms (drafts), consent banner (only if non-essential cookies or analytics are used)
- Django admin behind Cloudflare Access, with audit log
- Observability basics: logs, Sentry, health checks, data freshness alerts
- English only, metric units with a knots toggle
- Kill switch for risk output

**Explicitly out of scope for MVP**
- Phone OTP login
- Regional languages and voice input
- Raster overlay layers (chlorophyll or SST heat maps), tide tables, currents animation
- Push notifications and SMS or WhatsApp alerts
- Catch logging, trip planning, route planning
- Native mobile apps
- Sharing of risk results by link
- Authority or researcher roles, bulk exports, public API keys
- Payments and subscriptions
- Pollution and water quality agent beyond what advisories already say (no invented data)
- Algal bloom detection beyond a chlorophyll anomaly flag with clear caveats

**MVP exit criteria**
- [ ] Risk thresholds reviewed by a named domain expert and recorded
- [ ] Every endpoint has permission tests
- [ ] Risk engine at 100 percent branch coverage
- [ ] LLM eval set passing at the agreed rate, validator tests green
- [ ] Backup and restore rehearsed. Rollback rehearsed.
- [ ] Accessibility manual checks done on a real phone and a screen reader
- [ ] Data licences for every source recorded
- [ ] Privacy Policy and Terms reviewed by a lawyer before public use
- [ ] A small pilot with fishermen or coastal staff gives feedback on whether answers are understandable

## v1 (after pilot feedback)

- Phone OTP login (SMS provider decision, cost and DPDP review)
- Hindi plus one or two coastal regional languages for UI and chat; evaluation set per language
- Voice input and read-aloud of the risk summary (browser capabilities permitting, verify)
- Push notifications for alerts (web push), email retained
- Raster layers: chlorophyll and SST overlays as tiles stored in R2, with legends and data age
- Wider coastline coverage and a coverage map
- Improved fishing-zone method with feedback from pilot users (validated against official PFZ where possible)
- Tide and current information if a reliable source is confirmed
- Authority view: multi-location monitoring table, read-only
- Offline improvements: cache a saved location's latest assessment and map area for offline viewing
- Admin tools: advisory manual entry and approval flow, source health page
- Analytics with consent, and field measurement of web vitals

## Later

- Mobile app wrapper or native app with the same API (add token-based auth only for that client)
- SMS or WhatsApp advisories for areas with poor data access (cost, consent and provider review)
- Pollution, water quality and algal bloom agents with validated data sources and expert review
- Ecosystem health indicators for researchers (coral, seagrass, fish stock proxies) with open data exports
- Public read-only API with keys and quotas
- Trip log and catch reporting that feeds anonymised sustainability data
- Integration with official platforms if partnerships allow
- Multi-region deployment and managed database
- Evaluations of agent quality over time with a public methodology

## Risks that could change the plan

| Risk | Effect | Response |
|---|---|---|
| No stable access to an official advisory feed | Cannot show advisories reliably | Manual entry through admin by a trusted operator, with timestamps. Treat advisory data as `unknown` when stale. |
| Data licence blocks the intended use | Cannot ship that source | Swap source or limit to non-commercial demo wording |
| LLM cost higher than expected | Budget fallback triggers too often | Smaller model for intent, shorter prompts, caching, template-first answers |
| Thresholds cannot be validated by an expert | Cannot call it anything beyond a demo | Keep "demo, not for operational use" banner and disable alerts |
| Pilot shows users do not understand levels | Wrong decisions | Redesign copy and icons before adding features |
| Cloud cover leaves chlorophyll data empty most days | Fishing zones weak | Rely on SST and model products, state gaps clearly |

## How to propose a change to scope

Open an issue titled `scope: <change>` stating the user problem, what it displaces, and the effect on safety and cost. Update this file in the same PR that accepts the change.
