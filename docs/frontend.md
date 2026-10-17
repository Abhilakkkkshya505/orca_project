# Frontend Conventions (Vite + React + TypeScript)

Read `design.md` and `ignore.md` first.

## 1. Stack

React, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, react-hook-form + Zod, MapLibre GL JS with the `pmtiles` protocol, `vite-plugin-pwa` (Workbox), i18next, lucide-react, Sentry browser SDK, Vitest + Testing Library, Playwright, ESLint, Prettier. Package manager: pnpm.

Verify each package name and version against npm before installing (`npm view <name> version`). Pin with the lockfile.

## 2. Folder structure

```
frontend/src/
  app/
    main.tsx            entry
    providers.tsx       QueryClient, Router, Theme, i18n, Toasts
    router.tsx          route table, lazy imports
    error-boundary.tsx
  routes/               one file per route; thin; compose features
    landing.tsx, login.tsx, signup.tsx, verify-email.tsx, forgot-password.tsx,
    reset-password.tsx, explore.tsx, dashboard.tsx, locations.tsx,
    advisories.tsx, settings.tsx, privacy.tsx, terms.tsx, not-found.tsx
  features/
    auth/               forms, hooks (useMe, useLogin), guards
    chat/               ChatPanel, MessageList, useChatStream, RiskCard
    map/                MapView, layers, ramps.ts, useMapLayers
    dashboard/          OverviewCards, RiskList, DataFreshness
    locations/          LocationList, LocationForm, useLocations
    advisories/         AdvisoryTable, filters
    settings/           ProfileForm, UnitsForm, DeleteAccount
    landing/            sections
    consent/            ConsentBanner
  components/
    ui/                 Button, Input, Select, Dialog, Toast, Skeleton, RiskBadge, DataTable...
    layout/             AppShell, Sidebar, Topbar, TabBar, Footer
  lib/
    api/                client.ts, generated/ (OpenAPI types), errors.ts, sse.ts
    env.ts              validated import.meta.env
    format.ts           units, dates, numbers
    schemas/            Zod schemas matching DRF serializers
    storage.ts          guarded localStorage wrapper
  offline/              offline.html source, game.ts, reconnect.ts (no React)
  pwa/                  sw.ts (injectManifest), cache rules
  styles/               tokens.css, globals.css
  test/                 setup, factories, msw handlers
```

Rules:
- Routes compose. Features own logic. `components/ui` has no feature knowledge.
- A feature may import from `components`, `lib`, and other features' public `index.ts` only.
- Files over 200 lines are split.

## 3. Routing

React Router with lazy-loaded route modules. Public routes: `/`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`, `/explore` (guest chat and map), `*`. Protected routes: `/dashboard`, `/locations`, `/advisories`, `/settings`.

`RequireAuth` guard:
1. Reads `useMe()`. While loading, shows the page skeleton.
2. If 401, redirects to `/login?next=<path>`.
3. If the user is unverified, redirects to `/verify-email`.

`next` is validated to be a same-origin relative path before use.

## 4. State management

| Kind of state | Tool |
|---|---|
| Server data (user, locations, advisories, risk, threads) | TanStack Query |
| Form state | react-hook-form with Zod resolver |
| URL state (map centre, selected date, table sort, filters, page) | search params |
| UI state (sidebar open, active tab) | component state or a small context |
| Preferences (theme, units) | `localStorage` through `lib/storage.ts`, mirrored to the user profile when signed in |

No Redux or Zustand at MVP. Add one only with a written reason.

Query key convention: `['locations', 'list']`, `['risk', {lat, lon, from, to, vessel}]`, `['advisories', filters]`.

## 5. Data fetching and the API client

- Types come from the backend OpenAPI schema: `pnpm api:generate` runs `openapi-typescript` against `backend/schema.yml` (verify tool and package names) and writes `src/lib/api/generated/`. Generated files are committed and never edited.
- `lib/api/client.ts` wraps `fetch` with: `credentials: "include"`, `X-CSRFToken` header from the `csrftoken` cookie on unsafe methods, JSON parsing, and conversion of the standard error body into `ApiError`.
- On 401 from any call except `/auth/me/`, the client clears the `me` query and redirects to login with `next`.
- On 429, the error includes `retryAfterSeconds` and the UI shows it.
- Query defaults: `staleTime` 60 s for lists, 5 min for risk, `retry` 1 for non-4xx errors, no retry for 4xx.

### SSE chat client (`lib/api/sse.ts`, `features/chat/useChatStream.ts`)

- Uses `fetch` with a streaming body reader (not `EventSource`, because we need `POST` and cookies).
- Parses events: `status`, `risk`, `map`, `token`, `done`, `error`.
- Updates a local message state as events arrive. Risk and map events render immediately.
- Cancels with `AbortController` on unmount or new send.
- If the stream fails before `done`, shows the partial answer, an error line and a "Retry" button. It never shows a spinner without a status line.

## 6. Forms

- Zod schema per form in `lib/schemas/`. Rules mirror the DRF serializers (min password length, email format, lat/lon ranges).
- react-hook-form with `zodResolver`.
- Server field errors (`error.details`) are mapped to fields with `setError`. Non-field errors show above the submit button.
- Labels are always visible. Inputs set `autocomplete`, `inputMode` and `type` correctly (`email`, `new-password`, `current-password`).
- Submit buttons show a loading state and are disabled while pending.
- Turnstile widget is a controlled component. The token is added to the payload. A new token is requested after every failed submit, since tokens are single-use.

## 7. Error handling

- `app/error-boundary.tsx` wraps the router. It shows a page with a retry and a link home, and reports to Sentry with the request ID if one is known.
- Query errors are handled per view with an `ErrorState` component that shows what failed and a retry. No silent failures.
- `ApiError.code` maps to user messages in `lib/api/errors.ts`. Unknown codes use a generic message plus the request ID.

## 8. Map

- `MapView` lazy-loads MapLibre and the PMTiles protocol. It is a separate chunk, loaded only on `/explore`, `/locations` and landing sample if used.
- Layers are data-driven GeoJSON sources: `location-marker`, `fishing-zones`, `advisory-areas`, and later raster overlays.
- Every map has a text alternative: the risk card and a list of zones and advisories with the same information. The map is never the only way to read a result.
- Keyboard: arrow keys pan, `+` and `-` zoom (MapLibre defaults), and a "Use this point" button lets a user set a location without dragging.
- Theme change swaps the map style.

## 9. PWA and offline

- `vite-plugin-pwa` with `injectManifest` so the service worker is ours and testable. (Verify plugin options before use.)
- Precache: app shell, `offline.html` and its script, fonts, icons.
- Runtime caching:

| Request | Strategy |
|---|---|
| Navigation | network first, 3 s timeout, fall back to cached shell, then `offline.html` |
| `GET /api/v1/risk/`, `/advisories/`, `/dashboard/overview/` | network first, then cache; cached responses carry `x-orca-cached: true` added by the SW so the UI can show "Saved 3 h ago" |
| `POST`, auth, chat stream | network only |
| PMTiles range requests | cache-first for tiles already fetched, with size cap |
| Static assets | cache first, hashed filenames |

- Cached API responses are cleared on logout.
- Offline page shows the last cached advisory summary for saved locations if available, labelled with its age, and the fish game. See `design.md` for tone.
- `reconnect.ts` listens to `online` events and pings `/api/v1/health/live` before redirecting back to the app.
- The service worker update flow shows a "New version available" banner with a reload button. It never forces reload mid-form.

## 10. i18n

`i18next` with namespaces per feature. All user-facing strings go through `t()`. MVP ships `en`. Number, unit and date formatting go through `lib/format.ts` using `Intl`. Hindi and regional languages are in `roadmap.md`.

## 11. Tailwind

- `tailwind.config.ts` maps CSS variables from `styles/tokens.css` to theme colours (`bg`, `surface`, `ink`, `primary`, `risk-safe-fg`, ...). Raw hex in components is banned.
- Use Tailwind utilities in JSX. Extract a component, not a CSS class, when repeating.
- `@apply` is allowed only inside `globals.css` for base element styles.

## 12. Testing hooks

Components expose `data-testid` only where role and name queries are not enough. Prefer `getByRole`. See `testing.md`.

## 13. Tooling

- ESLint with `@typescript-eslint` strict-type-checked, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import` ordering.
- Prettier for formatting.
- `knip` (or equivalent) to find unused files, exports and dependencies in CI.
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
