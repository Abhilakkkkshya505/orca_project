# SEO

ORCA is mostly an authenticated tool. Search traffic matters for the landing page, the privacy and terms pages, and a few public explainer pages. Everything else is not indexed.

## 1. Scope

| Route | Indexed | Notes |
|---|---|---|
| `/` landing | yes | main target |
| `/privacy`, `/terms`, `/accessibility` | yes | trust pages |
| `/explore` | no at MVP | dynamic, guest tool. Consider indexing a static "how ORCA reads a forecast" page instead |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | no | `noindex` |
| `/dashboard`, `/locations`, `/advisories`, `/settings` | no | `noindex`, also blocked by auth |
| `/offline.html`, 404 page | no | `noindex` |
| API host | no | `X-Robots-Tag: noindex` on all API responses |

## 2. Rendering strategy

The app is a Vite SPA. Search engines can run JavaScript, but a client-rendered landing page is slower to index and slower to show. The landing page and legal pages are **prerendered to static HTML at build time** (verify the chosen approach and plugin, for example a Vite static generation plugin or a small build script that renders those routes with React's server renderer). Result: real HTML content in the first response for those routes, with the SPA hydrating on top.

Do not prerender authenticated routes.

## 3. Page metadata

Per indexed page:
- Unique `<title>` (50 to 60 characters) and `<meta name="description">` (140 to 160 characters), written for people, with real content.
- `<link rel="canonical">` to the full `https://app.orca.example/...` URL.
- Open Graph: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image` (a real screenshot of a risk card for a named sample place, 1200 by 630, labelled sample), `og:site_name`.
- Twitter card: `summary_large_image`.
- `<html lang="en">`.
- `theme-color` for light and dark.

Example landing title and description (final copy is written in the landing page work):
- Title: "ORCA: Sea conditions and fishing zones for your coast"
- Description: "Ask if it is safe to go out. ORCA reads wave, wind and satellite data and shows a clear safety rating and likely fishing areas, with the data age."

## 4. robots.txt and sitemap

`frontend/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /locations
Disallow: /advisories
Disallow: /settings
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email
Sitemap: https://app.orca.example/sitemap.xml
```

Note: `Disallow` stops crawling but does not guarantee removal from the index. Pages that must never be indexed also send `<meta name="robots" content="noindex">`. Because a blocked page cannot be crawled to read that tag, keep the meta tag on pages we want deindexed and do not block them in robots.txt if they were ever indexed. For new auth pages, both are fine.

`sitemap.xml` is generated at build and lists only indexable routes with `lastmod` from the build date or content date.

The API serves `X-Robots-Tag: noindex, nofollow` on all responses through middleware.

## 5. Structured data

Minimal JSON-LD on the landing page only:
- `WebApplication` with `name`, `applicationCategory` ("WeatherApplication" or a suitable category, verify allowed values), `operatingSystem` ("Any"), `url`, and an `offers` entry only if accurate.
- `Organization` with name and contact URL.

No fake `AggregateRating`, review or FAQ markup. Only add FAQ markup if the visible page has those questions.

## 6. Content guidelines

- One clear `h1` that says what ORCA does for whom.
- Real examples with real places and units. No keyword stuffing, no hidden text.
- Internal links between landing, privacy, terms, accessibility and the explore tool.
- Images have `alt` text that describes the content. Sample risk card images say "Sample" in the alt text and the visible caption.
- No lorem ipsum, no fake stats, no fake logos (see `ignore.md`).

## 7. Performance and SEO

Core Web Vitals budgets in `performance.md` apply to the landing page first. Fonts are self-hosted and preloaded for the critical weights only. Images use modern formats with explicit width and height to prevent layout shift.

## 8. Internationalisation

Launch is English. When more languages are added: one URL per language (`/hi/`, `/ta/`), `hreflang` links, translated metadata, and a language switcher that is a real link.

## 9. Social and sharing

- A risk result link is not public by default. If sharing is added later, shared pages are `noindex` and expire.
- Share cards must state the data time, because an old screenshot of a "safe" rating is dangerous.

## 10. Measurement

- Google Search Console and Bing Webmaster Tools for the domain (verify via DNS record).
- Lighthouse CI on the landing page in CI with budgets from `performance.md`.
- Analytics only after consent (see `observability.md`).

## 11. Checklist before launch

- [ ] Landing and legal pages prerendered, content visible with JavaScript disabled
- [ ] Titles, descriptions, canonicals, OG tags set and previewed
- [ ] `robots.txt` and `sitemap.xml` live, sitemap submitted
- [ ] Auth and app pages have `noindex`
- [ ] API sends `X-Robots-Tag`
- [ ] Structured data validated
- [ ] 404 page returns HTTP 404 for unknown routes on prerendered hosts. (Pages SPA fallback returns 200 by default. Decide and document: unknown paths under the prerendered set return the 404 page with the right status through a Pages function or `_redirects` rules; verify capability.)
