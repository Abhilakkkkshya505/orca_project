# Design System

## 1. Brand personality

ORCA is an instrument, not a toy. People use it to decide whether to take a boat out. The design should feel like a well-made nautical chart: calm, precise, readable in glare, and honest about uncertainty.

| Is | Is not |
|---|---|
| Calm, exact, plain-spoken | Playful, hype-driven, techy |
| High contrast, large type, big targets | Decorative, glassy, glowing |
| Chart-paper and ink | Gradient and neon |
| Explicit about data age and gaps | Falsely confident |

Visual references: printed Admiralty charts, instrument panels, newspaper weather maps. Not SaaS landing templates.

## 2. Colour tokens

Names are semantic. Components use tokens only, never raw hex. Hex values are the starting palette. **Run every foreground/background pair through a contrast checker and record results in `docs/contrast-report.md` before release.** Targets: body text 4.5:1 or higher, large text and UI boundaries 3:1 or higher.

### Light mode

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F4F1EA` | page background (chart paper) |
| `surface` | `#FBFAF6` | cards, panels |
| `surface-raised` | `#FFFFFF` | popovers, dialogs, inputs |
| `border` | `#CFC9BA` | dividers, card borders |
| `border-strong` | `#8B8574` | input borders, focus-adjacent boundaries |
| `ink` | `#0E2231` | primary text |
| `ink-muted` | `#44596A` | secondary text, captions |
| `primary` | `#0F5C6E` | primary buttons, links, active nav |
| `primary-hover` | `#0B4756` | hover and pressed |
| `on-primary` | `#FFFFFF` | text on primary |
| `focus` | `#B45309` | focus ring (2 px, 2 px offset) |
| `water` | `#CFE3E8` | map water tint, neutral data fills |

### Risk tokens (the most important set)

Risk is never shown by colour alone. Every level has a colour, an icon shape and a word.

| Level | Text/icon | Background | Icon shape | Label |
|---|---|---|---|---|
| safe | `#1B6B3F` | `#E1F1E7` | check in circle | Safe |
| caution | `#7A4B00` | `#FCEBC2` | triangle with bar | Caution |
| unsafe | `#9F1D17` | `#F9DAD7` | octagon with bar | Unsafe |
| unknown | `#44596A` | `#E3E6E8` | circle with question mark | Unknown |

`unknown` is a first-class state and must look as deliberate as the others. It is not a grey error.

### Dark mode

| Token | Hex |
|---|---|
| `bg` | `#0A1A24` |
| `surface` | `#10242F` |
| `surface-raised` | `#16303D` |
| `border` | `#26414F` |
| `border-strong` | `#6C8796` |
| `ink` | `#E6EEF2` |
| `ink-muted` | `#A3B6C1` |
| `primary` | `#5FB4C7` |
| `primary-hover` | `#85C8D6` |
| `on-primary` | `#06202A` |
| `focus` | `#F59E0B` |
| `water` | `#143846` |

Dark risk tokens: safe `#7ED3A0` on `#12301F`, caution `#F2C14E` on `#3A2A07`, unsafe `#FF9E96` on `#3F1411`, unknown `#A3B6C1` on `#1C2E39`.

Dark mode follows `prefers-color-scheme` by default, with a user override stored in `localStorage`. Default for first visit is light because of outdoor glare use.

### Usage rules

- One accent: `primary`. No second brand colour.
- Risk colours appear only for risk. Never use them for decoration, buttons or charts that are not risk.
- No gradients on surfaces, text or buttons. The only gradient allowed is the map legend ramp for data scales.
- Map data scales use a sequential single-hue ramp for magnitude (wave height, chlorophyll) and a diverging ramp only for anomalies. Both must be colour-blind safe. Document ramps in `frontend/src/features/map/ramps.ts`.

## 3. Typography

Self-hosted through `@fontsource` packages so the offline page and PWA work without network. Verify package names before install.

| Role | Family | Weights |
|---|---|---|
| Text and headings | IBM Plex Sans | 400, 500, 600 |
| Numbers, coordinates, data values | IBM Plex Mono | 400, 500 |

Font stacks include system fallbacks: `"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Tabular numbers (`font-variant-numeric: tabular-nums`) for all data tables and risk factors.

### Scale

Base 16 px. Mobile-first, with larger display sizes from `md` up.

| Token | Size / line height | Use |
|---|---|---|
| `text-xs` | 12 / 16 | map attribution, fine print (never for essential info) |
| `text-sm` | 14 / 20 | table cells, captions |
| `text-base` | 16 / 24 | body |
| `text-lg` | 18 / 28 | lead text, chat messages |
| `text-xl` | 20 / 28 | card titles |
| `text-2xl` | 24 / 32 | page titles (mobile) |
| `text-3xl` | 30 / 36 | page titles (desktop) |
| `text-5xl` | 48 / 52 | landing headline (desktop only) |

Line length for prose: 60 to 75 characters. Headings use weight 600, never 700 or above.

## 4. Spacing, radii, shadows

- Spacing base unit: 4 px. Allowed steps: 4, 8, 12, 16, 24, 32, 48, 64.
- Radii: `sm` 4 px (chips, inputs), `md` 8 px (buttons, cards), `lg` 12 px (dialogs, sheets). No pill buttons except chips.
- Shadows: two only.
  - `shadow-card`: `0 1px 2px rgb(14 34 49 / 0.08)`
  - `shadow-overlay`: `0 8px 24px rgb(14 34 49 / 0.16)`
- Borders do most of the elevation work. Prefer a 1 px border to a shadow.

## 5. Motion

- Durations: 120 ms (hover, press), 200 ms (open/close), 300 ms maximum for anything else.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` for entering, `cubic-bezier(0.4, 0, 1, 1)` for leaving.
- No parallax, no scroll-jacking, no looping decorative animation.
- Streaming chat text appears token by token without per-letter animation.
- `prefers-reduced-motion: reduce`: remove transforms and fades, keep instant state changes. The offline game reduces particle effects and starts on a calmer difficulty curve.

## 6. Layout and breakpoints

Mobile-first. Tailwind default breakpoints are kept so the team does not relearn them.

| Name | Min width | Layout |
|---|---|---|
| base | 0 | single column, bottom tab bar, map and chat as tabs |
| `sm` | 640 px | wider single column |
| `md` | 768 px | split view: chat panel left, map right |
| `lg` | 1024 px | sidebar nav appears in the dashboard |
| `xl` | 1280 px | max content width 1200 px for non-map pages |

The map and chat page uses the full viewport height with `100dvh`. Content respects `env(safe-area-inset-*)`.

## 7. Component rules

General:
- Minimum touch target 44 by 44 px, even if the visible element is smaller.
- Every interactive element has hover, focus-visible, active, disabled and loading states.
- Focus ring: 2 px `focus` colour, 2 px offset, never removed.
- No hover-only information. Everything reachable by hover is reachable by tap and keyboard.
- Icons: one set, `lucide-react`, stroke 1.75, with an `aria-hidden` unless the icon is the only label. Risk icons are custom SVGs in `components/ui/risk-icons.tsx`. No emoji as icons.

Specific components:

| Component | Rules |
|---|---|
| Button | Variants: `primary`, `secondary` (border only), `ghost`, `danger`. Height 44 px. Label is a verb. Loading state keeps width and shows a spinner plus label. |
| Input | Visible label above. Helper and error text below. Error text uses text and an icon, not only a red border. Autocomplete attributes set. |
| RiskBadge | Icon + word + colour pair. Sizes `sm`, `md`. Always renders the level word. |
| RiskCard | Header with RiskBadge and valid window. Body with factor rows (label, value with unit, threshold, source). Footer with data ages and "Official warnings override ORCA." |
| FactorRow | Name, value in mono font, small bar showing position between caution and unsafe thresholds, and a text level. |
| ChatMessage | User messages right aligned on `surface-raised`. Assistant messages full width on `surface`. Assistant messages with a risk result render the RiskCard before the prose. |
| DataTable | Sticky header, sortable columns announced with `aria-sort`, row height 48 px, pagination at the bottom, count shown. |
| EmptyState | One sentence on what is missing, one action. No illustrations of rockets or sparkles. |
| Skeleton | Matches final layout dimensions. No shimmer under `prefers-reduced-motion`. |
| Toast | For confirmation only. Errors that block progress show inline, not in toasts. Auto-dismiss 5 s, pause on hover and focus. |
| Dialog | Only for destructive confirmation and short forms. Not for navigation. |
| Map controls | Zoom, locate me, layer toggle, legend. All keyboard reachable. Legend is text plus swatch. |

## 8. Data presentation rules

- Units: metric by default (metres, km/h, degrees Celsius). Knots available in settings. Show the unit every time.
- Always show **when**: "Valid 06:00 to 18:00 Sat" and "Wave data from 4 h ago".
- Time displayed in the user's device time zone, with `IST` or the abbreviation shown when the zone is IST.
- Round sensibly: waves to 0.1 m, wind to whole km/h, SST to 0.1 °C.
- Missing data reads "No data" with the reason, never `0`, `-` or blank.
- Fishing zones are labelled "Likely productive area" and always show their origin (official advisory or ORCA estimate).

## 9. Dark and light mode implementation

- CSS variables on `:root` and `[data-theme="dark"]`. Tailwind colours reference the variables.
- The map style has light and dark variants. Switching theme swaps the style.
- Images and icons use `currentColor` or token colours. No images with baked-in backgrounds.

## 10. Accessibility requirements for design

Detailed in `accessibility.md`. Design-level rules:
- WCAG 2.2 AA minimum.
- Never convey meaning by colour alone.
- Text can be zoomed to 200 percent without loss of function.
- Layout works at 320 px width.

## 11. Tone of voice

- Plain words. Short sentences. Say what is known, what is not, and how old the data is.
- Use "you" and "your". Do not use "we" to speak for ORCA's feelings.
- Numbers with units. No vague words like "rough" without a number beside them.
- No exclamation marks in safety content. No jokes in safety content.
- Errors say what happened and what to do next.

Examples:

| Situation | Write | Do not write |
|---|---|---|
| Unsafe | "Unsafe for small boats from 06:00 to 14:00. Waves reach 2.8 m." | "Danger zone! Stay safe out there!" |
| Unknown | "ORCA cannot rate this area. Wave data is 19 hours old. Check the official advisory." | "Something went wrong." |
| Offline | "You are offline. The last advisory for Kochi was saved 3 hours ago." | "Oops! No connection." |
| Empty table | "No active advisories for your saved places." | "Nothing to see here." |
| Guest limit | "You have used 10 free questions this hour. Sign in to ask more, or try again in 32 minutes." | "Limit reached." |

## 12. Data-Driven Sea-State Animation (`<SeaState />`)

*Exception to general animation restriction:* Data-driven sea-state animation is allowed when it reflects real forecast values, is labelled, and respects reduced motion.

### WMO Sea State (Douglas Scale) Class Boundaries

The descriptive sea state label is derived strictly from significant wave height ($H_s$) using the World Meteorological Organization (WMO) Code Table 3700 (Douglas Sea Scale):

| Douglas Degree | Significant Wave Height ($H_s$) | WMO Sea State Description |
|---|---|---|
| 0 | 0.0 m | Calm (glassy) |
| 1 | 0.0 – 0.1 m | Calm (rippled) |
| 2 | 0.1 – 0.5 m | Smooth |
| 3 | 0.5 – 1.25 m | Slight |
| 4 | 1.25 – 2.5 m | Moderate |
| 5 | 2.5 – 4.0 m | Rough |
| 6 | 4.0 – 6.0 m | Very rough |
| 7 | 6.0 – 9.0 m | High |
| 8 | 9.0 – 14.0 m | Very high |
| 9 | > 14.0 m | Phenomenal |

*Source citation:* World Meteorological Organization (WMO), *Guide to Meteorological Instruments and Methods of Observation* (WMO-No. 8), Part II, Chapter 4: Marine Observations.

### Animation Physics & Accessibility Rules
- **Amplitude Formula:** `ampPx = clamp(containerHeight * 0.08 * (H^0.7), 2, containerHeight * 0.35)`.
- **Period / Duration:** Derives from forecast peak wave period $T_p$: `duration = clamp(period, 3, 14)` seconds.
- **Layers:** 3 layered SVG paths (back swell, mid wave, front wind wave) using GPU-accelerated CSS transforms.
- **Reduced Motion:** If `prefers-reduced-motion` is active or user pauses, freezes into a static vector wave with exact same amplitude. Pauses automatically when off-screen or tab is backgrounded.
- **Data Gap Handling:** When data is missing, renders calm horizontal line with label *"No recent data"*.

