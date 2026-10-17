# Accessibility

Target: **WCAG 2.2 level AA** for every page and flow. Many users are outdoors, in glare, on small screens, with wet hands, or with limited literacy in English. Accessibility here is also a safety feature.

## 1. Rules that apply to everything

| Area | Requirement |
|---|---|
| Contrast | Text 4.5:1, large text and UI boundaries 3:1, in light and dark mode. Check every token pair and record in `docs/contrast-report.md`. |
| Colour | Never the only carrier of meaning. Risk uses icon, word and colour. |
| Target size | 44 by 44 px minimum for touch targets. |
| Keyboard | Everything works without a mouse. Logical tab order. No keyboard traps. |
| Focus | Visible focus ring on every interactive element (2 px, 2 px offset, token `focus`). Focus is not hidden under sticky bars (`scroll-padding`). |
| Zoom | Usable at 200 percent zoom and at 320 px width without horizontal scroll (the map is exempt from reflow but has a text equivalent). |
| Motion | `prefers-reduced-motion` respected everywhere, including the game. No flashing above 3 times per second. |
| Language | `<html lang>` set, updated when the UI language changes. |
| Time limits | None except session expiry, which gives a clear message and keeps form drafts for the location form. |
| Text spacing | Layout survives user-set line height, letter and word spacing. |
| Authentication | No cognitive test. Password managers and paste work. `autocomplete` attributes are correct. Turnstile is configured for accessible challenge modes (verify current options). |

## 2. Structure and semantics

- One `<h1>` per page. Heading levels do not skip.
- Landmarks: `header`, `nav` (labelled), `main`, `footer`. The dashboard has `aside` for the sidebar.
- Skip link "Skip to main content" is the first focusable element.
- Page title changes on route change and focus moves to the `h1` (or a live region announces the route).
- Use native elements first (`button`, `a`, `input`, `table`). ARIA only to fill gaps.
- Icons that carry meaning have text alternatives. Decorative icons have `aria-hidden="true"`.

## 3. Forms

- Visible label for every field. Placeholder is never the label.
- Errors: text next to the field, associated with `aria-describedby`, plus an error summary at the top that receives focus after a failed submit.
- Required fields indicated in text, not only with an asterisk.
- Input purpose through `autocomplete`, `type`, and `inputMode`.
- No time-limited forms except those with a visible and extendable timeout.

## 4. Chat

- Message list is a `role="log"` region with `aria-live="polite"`. Streaming tokens update a hidden buffer, and the live region announces **status steps and the completed answer**, not every token (avoids screen reader flood).
- Risk result is announced as one sentence first: "Caution. Valid 06:00 to 18:00. Wave height 1.8 metres." Then details.
- Input has a label, supports Enter to send and Shift+Enter for newline, and the send button has an accessible name.
- Loading and error states are text, not only spinners.

## 5. Map

- The map is **never the only way** to get information. The risk card, zone list and advisory list present the same data as text and tables.
- Map container has an accessible name and instructions ("Use arrow keys to pan, plus and minus to zoom").
- "Use this point" button and latitude and longitude fields let a keyboard or screen reader user set a location without dragging.
- Zone and advisory features are listed with their risk level in words. Selecting a list item focuses the feature on the map.
- Legends are text plus swatch. Layer toggles are real checkboxes or switches.
- Map controls meet target size and are reachable by keyboard.

## 6. Tables

- Real `<table>` with `<caption>`, `<th scope>`.
- Sortable headers are buttons inside `th` with `aria-sort`.
- Pagination controls are labelled, and the current page uses `aria-current="page"`.
- On narrow screens, tables become stacked cards that keep label and value pairs in text. Do not hide columns without a way to read them.

## 7. Offline page and game

- The offline page has a clear heading, message and a "Try again" button.
- The game: playable with keyboard (arrows or WASD to move, Space or P to pause, R to restart) and touch (drag or on-screen arrows). Pause on blur or tab hidden.
- Score changes are announced politely at low frequency (every 5 points and at game over).
- Provide "Reduce effects" (default on if `prefers-reduced-motion`): fewer particles, slower hazards, no screen shake.
- The game is optional. The page content (offline message, cached advisory, reconnect) works without it. The canvas has an accessible label and a text alternative describing it as an optional game.
- Colours of hazards and food are distinguishable by shape and not only colour.

## 8. Dialogs, toasts, menus

- Dialogs trap focus, restore focus on close, close with Escape, and have an accessible name.
- Toasts use `role="status"` for confirmations. Errors that block progress are inline.
- Menus and tabs follow the WAI-ARIA authoring practices patterns (verify against the current guide), or use a tested headless library (verify package choice, e.g. Radix UI).

## 9. Content

- Plain language, short sentences. Reading level target: grade 8 or lower in English.
- Units and times spelled clearly. Abbreviations expanded on first use ("significant wave height").
- Safety statements never rely on a tooltip.

## 10. Testing

Automated:
- `eslint-plugin-jsx-a11y` in lint.
- Axe in component tests and in every Playwright flow, failing on `serious` or `critical`.

Manual (before each release):
- [ ] Keyboard-only through signup, login, chat question, saving a location, advisories table, settings
- [ ] Screen reader pass: NVDA with Firefox or Chrome on Windows, VoiceOver on iOS, TalkBack on Android (at least the chat and risk card)
- [ ] 200 percent zoom and 320 px width
- [ ] Dark mode and light mode contrast spot check
- [ ] Reduced motion setting on, game and transitions checked
- [ ] Windows High Contrast / forced colours mode spot check
- [ ] Outdoor glare check on a real phone at full brightness

## 11. Accessibility statement

Publish `/accessibility` with the target (WCAG 2.2 AA), known issues, and a contact for reports. Update at each release.
