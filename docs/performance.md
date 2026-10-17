# Performance

Reference device: a mid-range Android phone on a throttled 4G connection, because that is the likely user. Lab tests use Lighthouse mobile settings plus real-device checks. Budgets are starting values. Tighten them after the first real measurements, and record every change in this file.

## 1. Web vitals budgets

| Metric | Landing page | App pages (Explore, Dashboard) |
|---|---|---|
| LCP | 2.5 s or less (p75) | 3.0 s or less (p75) |
| INP | 200 ms or less | 200 ms or less |
| CLS | 0.1 or less | 0.1 or less |
| TTFB (Pages, cached) | 600 ms or less | 600 ms or less |

Field data (from real users) comes from the `web-vitals` library sent to the log or analytics endpoint **only with consent**. Until then, lab data from Lighthouse CI and manual device tests.

## 2. Bundle budgets (gzip)

| Bundle | Budget |
|---|---|
| Landing route JS (critical) | 120 KB |
| App shell JS (router, providers, UI primitives) | 180 KB |
| Explore route JS excluding map chunk | 120 KB |
| Map chunk (MapLibre + PMTiles + layers), lazy | 330 KB |
| Offline page JS (standalone, no framework) | 30 KB |
| CSS total | 40 KB |
| Fonts (critical weights only, WOFF2) | 100 KB total |

CI fails if a budget is exceeded by more than 5 percent. Use a bundle analyser (verify tool) in CI output. Review any new dependency over 10 KB gzip.

Rules to stay inside the budget:
- Route-level code splitting for every route except the shell.
- MapLibre loads only where a map is shown.
- No moment.js or lodash full import. Use `Intl` and small helpers.
- Icons imported by name from `lucide-react`.
- Subset fonts to Latin plus the scripts we ship. Use `font-display: swap`. Preload only the body regular and heading semi-bold.
- Images: AVIF or WebP, explicit dimensions, `loading="lazy"` below the fold. The landing hero uses a real risk card rendered as HTML and SVG, not a large image.

## 3. Network and caching

- Hashed static assets: `Cache-Control: public, max-age=31536000, immutable` (set through Pages `_headers`).
- `index.html` and the service worker file: short cache or `no-cache`.
- PMTiles on R2: range requests, cached at Cloudflare edge for the tile file path (configure cache rules, verify).
- API responses: `Cache-Control: private, max-age=0` for user data. Public read endpoints (`/advisories/`, `/data-status/`) send `Cache-Control: public, max-age=60` and `Vary: Cookie` is **not** used on those, so they must not depend on the session. If a response differs for signed-in users (`saved=true`), it uses a different path or `private`.
- Compression: Brotli at Cloudflare for static assets and API.
- HTTP/2 and HTTP/3 through Cloudflare.

## 4. Runtime performance (frontend)

- Chat message list virtualises after 100 messages.
- Streaming updates are batched with `requestAnimationFrame` so the UI updates at most once per frame.
- Map layer updates replace GeoJSON sources, not recreate layers.
- Heavy computation (none planned) goes to a Web Worker.
- The offline game runs at 60 fps on the reference device: fixed time step, object pooling, no allocation in the main loop, one canvas, sprite shapes drawn from cached paths or a small spritesheet. Reduced effects mode cuts particle counts.
- Avoid layout thrash: batch DOM reads and writes. Reserve space for skeletons, maps and cards.

## 5. API budgets

| Endpoint class | p50 | p95 | Notes |
|---|---|---|---|
| Health | 10 ms | 50 ms | |
| Reads (advisories, locations, data-status) | 80 ms | 300 ms | cached or indexed |
| `GET /risk/` (cache hit) | 40 ms | 150 ms | |
| `GET /risk/` (cache miss) | 200 ms | 600 ms | DB reads only, no external calls |
| Dashboard overview | 150 ms | 500 ms | uses cached assessments |
| Chat: time to first SSE event | 300 ms | 1.5 s | `status` event sent before any agent work |
| Chat: time to `risk` event | 1.5 s | 4 s | after intent extraction |
| Chat: full answer | 6 s | 12 s | LLM bound |
| Auth endpoints | 150 ms | 500 ms | password hashing included |

Measured from the API container (server time), plus a separate synthetic check from an Indian vantage point.

## 6. Database budgets and N+1 prevention

- Maximum queries per request: list endpoints 8, detail 6, overview 12, risk (cache miss) 10. Enforced with `django_assert_max_num_queries` tests.
- `select_related` for FKs, `prefetch_related` for reverse relations and `Prefetch` objects for filtered children.
- No queries inside serializer `to_representation` loops. Annotate in the queryset instead.
- Every filter and ordering field is indexed (see `database.md`). Check with `EXPLAIN (ANALYZE, BUFFERS)` on seeded realistic data for the advisories list and the nearest-cell lookup.
- Nearest-cell lookup under 5 ms with the GiST index.
- Connection reuse with `CONN_MAX_AGE=60`. Pool sizing reviewed under load.
- Slow query threshold 200 ms logged. Anything repeated is fixed or indexed.

## 7. Background work

- Ingestion tasks use bulk inserts (`bulk_create` with `ignore_conflicts`) in batches of 1,000 rows.
- Regional downloads use subsetting at the provider (bounding box, variables, time range). Never download global files to cut a region locally.
- Task time limits: ingestion 10 minutes soft, 12 hard. Alert evaluation 2 minutes.
- Heavy raster handling (future) runs in a separate worker queue so it cannot starve chat-triggered or alert tasks.

## 8. LLM cost and latency

- Intent extraction uses a small, fast model and a short prompt. Explanation uses the same or a larger model only if the eval set shows a quality gain (decide from data).
- Prompts contain only structured results, not raw tables of grid data.
- Cap `max_tokens` for both calls. Explanation target under 150 words.
- Cache intent extraction for identical normalised questions for 10 minutes.
- Daily token budget with fallback (see `architecture.md`).
- Track tokens per answer in `chat.answered` logs and review weekly.

## 9. Measurement process

| When | What |
|---|---|
| Every PR | bundle size check, unit and integration tests, query counts |
| Every PR touching landing | Lighthouse CI (mobile) against budgets |
| Weekly | review p95 API times, slow queries, `unknown` share |
| Before each release | real-device test on a mid-range Android with throttled network, offline test, game frame rate check |
| Before launch | load tests in `testing.md` section 6 |

## 10. Performance checklist for a new feature

- [ ] Does it add a dependency over 10 KB gzip? Justified?
- [ ] Is it lazy-loaded if not needed on first paint?
- [ ] Skeleton matches final size (no layout shift)?
- [ ] Query count test added, indexes checked?
- [ ] Works acceptably on throttled 4G and a mid-range phone?
- [ ] Reduced-motion and low-end behaviour considered?
