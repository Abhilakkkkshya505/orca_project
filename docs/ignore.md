# ignore.md: Anti-AI-Slop Rulebook

Every human and every AI agent working in this repo follows these rules. A pull request that breaks one is not merged. "MUST" and "MUST NOT" are literal.

## 1. Banned visual patterns

- MUST NOT use purple-to-blue (or any) gradients on backgrounds, headings, buttons or cards. The only gradient allowed is a data legend ramp.
- MUST NOT use glassmorphism, frosted blur panels, or backdrop-filter as decoration.
- MUST NOT use random blob, wave or mesh backgrounds. Exception: Data-driven sea-state animation is allowed when it reflects real forecast values, is labelled, and respects reduced motion.
- MUST NOT use emoji as icons or bullets. Use the icon set in `design.md`.
- MUST NOT use stock rocket, sparkle, brain, shield-with-checkmark or "AI chip" illustrations. No generic fish or whale clip art in the app UI either.
- MUST NOT use an identical three-card feature grid. Landing sections vary in structure and content.
- MUST NOT centre a hero over a gradient headline. The landing hero shows a real risk card and map for a real sample place, left-aligned.
- MUST NOT stack drop shadows. Two shadow tokens exist. Use them sparingly.
- MUST NOT use neon glow, glowing borders or animated gradients.
- MUST NOT use colours outside `design.md`. Risk colours are for risk only.
- MUST NOT use fake dashboards, fake charts or mock numbers on the landing page. If a sample is shown, it is labelled "Sample" and uses real structure.

## 2. Banned copy

Words and phrases that MUST NOT appear in UI, docs, commit messages or comments:

`revolutionize`, `revolutionary`, `seamless`, `seamlessly`, `unlock the power`, `unlock`, `elevate`, `game-changer`, `game-changing`, `cutting-edge`, `state-of-the-art`, `leverage` (as a verb), `empower`, `harness`, `supercharge`, `next-generation`, `in today's fast-paced world`, `delve`, `dive into`, `landscape` (as in "the ocean data landscape"), `robust`, `holistic`, `synergy`, `AI-powered` as a headline.

Also banned:
- Em dash overuse. At most one per page. Prefer a full stop or a comma.
- Lorem ipsum or placeholder text of any kind.
- Fake testimonials, fake user counts, fake percentages, fake partner logos, fake "as seen in" bars.
- Claims about accuracy or safety that are not measured. No "accurate", "reliable" or "trusted" without a linked evaluation.
- Words that imply official status ("official", "certified", "approved") for ORCA output.
- Chatty filler: "Great question", "Certainly", "I hope this helps", "Let's dive in".

Required instead:
- Specific, concrete copy that names a place, a number, a unit and a time.
- Plain verbs. Short sentences.
- Honest statements of limits.

## 3. Banned frontend code habits

- MUST NOT write comments that restate the code. Comments explain why, not what.
- MUST NOT add abstraction before the second use. No generic wrappers, factories or "utils" dumping grounds.
- MUST NOT add a dependency without a written reason in the PR. Unused dependencies fail CI (`knip` or equivalent).
- MUST NOT use `any`. Use `unknown` and narrow it. `// @ts-ignore` is banned. `@ts-expect-error` needs a reason and a link.
- MUST NOT write components over 200 lines. Split by responsibility.
- MUST NOT copy-paste blocks. Extract at the third repetition.
- MUST NOT ship `TODO`, `FIXME`, `XXX` or placeholder strings. Create an issue and reference its number: `// see #123` is allowed.
- MUST NOT invent APIs, props, packages or functions. If unsure, read the docs or source and say what was checked.
- MUST NOT swallow errors. No empty `catch`. Every caught error is handled, reported, or rethrown.
- MUST NOT leave `console.log`, `debugger` or commented-out code.
- MUST NOT fetch in `useEffect` when TanStack Query applies.
- MUST NOT store server data in global client state.
- MUST NOT put secrets or API keys in the frontend. `VITE_*` values are public.
- MUST NOT use `dangerouslySetInnerHTML` without a sanitiser and a reviewer note.
- MUST NOT hand-write API types that the OpenAPI schema generates.

## 4. Banned backend code habits

- MUST NOT put business logic in views or serializers. Use `services.py`.
- MUST NOT create N+1 queries. Use `select_related` and `prefetch_related`. List endpoints have a query-count test.
- MUST NOT filter or order on a column without an index.
- MUST NOT write `except Exception: pass` or bare `except:`. Catch specific exceptions and log or re-raise.
- MUST NOT build SQL by string formatting. Raw SQL uses parameters.
- MUST NOT commit secrets. Settings read from the environment. `.env` is git-ignored.
- MUST NOT leave `permission_classes = [AllowAny]` on a view unless the view is listed in `docs/api.md` as public and has a permission test proving it.
- MUST NOT run production with `DEBUG=True`. `check --deploy` runs in CI.
- MUST NOT edit a migration after it has been applied anywhere shared. Add a new one.
- MUST NOT make a breaking API change without a new version path.
- MUST NOT use signals as hidden control flow. Call services explicitly.
- MUST NOT use `fields = "__all__"` on any serializer. List fields.
- MUST NOT return stack traces or internal messages to clients.
- MUST NOT trust `X-Forwarded-For` or `CF-Connecting-IP` outside the rules in `security.md`.
- MUST NOT let an agent or LLM output decide a risk level. Only `apps/risk/rules.py` does.
- MUST NOT put numeric safety facts in LLM prompts or outputs that did not come from a typed tool result.
- MUST NOT call an external data provider inside a user request. Ingestion tasks only.
- MUST NOT default missing data to a safe value. Missing means `unknown`.

## 5. Banned UX habits

- MUST NOT use a modal where a page, panel or inline control works.
- MUST NOT use dark patterns: hidden unsubscribe, pre-ticked consent, confirm-shaming, fake urgency.
- MUST NOT show an infinite spinner. Every wait has a timeout, a message and a retry.
- MUST NOT use tap targets under 44 by 44 px.
- MUST NOT use text with contrast below 4.5:1 (3:1 for large text and UI boundaries).
- MUST NOT hide anything behind hover.
- MUST NOT convey risk with colour alone.
- MUST NOT show a safety level without its valid window and data age.
- MUST NOT auto-play sound or motion.
- MUST NOT block the app on cookie consent. Essential cookies work without a choice.

## 6. Required instead

- Concrete, local, measurable copy.
- A restrained palette from `design.md`.
- Purposeful typography from `design.md`.
- Real empty, loading and error states for every data view.
- Package names and versions verified against the registry before use.
- A permission test for every endpoint (see `testing.md`).
- A unit test for every rule in the risk engine, including boundary values.
- Source and timestamp on every safety-relevant number.

## 7. Instructions for AI coding agents

1. Read `CLAUDE.md`, then this file, then the doc for the area you are changing.
2. If you are unsure that a library, function or flag exists, say so and check. Do not guess.
3. Make the smallest change that solves the task. Do not refactor unrelated code.
4. Do not write explanatory comments for obvious code.
5. Do not add features that were not requested.
6. Write or update tests in the same change.
7. Run the commands in `CLAUDE.md` before declaring work done, and report their real output.
8. If a task conflicts with a rule here, stop and ask.

## 8. Pre-merge checklist

Copy into the PR description. Every box checked or marked N/A with a reason.

### Both stacks
- [ ] No banned words, no lorem ipsum, no fake numbers or logos in changed files
- [ ] No leftover `TODO`, `console.log`, `print`, commented-out code
- [ ] No new dependency, or a written reason is included
- [ ] Docs updated if behaviour, endpoints, env vars or architecture changed
- [ ] `CHANGELOG.md` updated for user-visible changes
- [ ] No secrets in diff

### Frontend
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass
- [ ] No `any`, no `@ts-ignore`
- [ ] No component over 200 lines
- [ ] Loading, empty and error states exist and were seen in the browser
- [ ] Keyboard-only walkthrough done; focus order and focus ring correct
- [ ] Contrast of new colours checked
- [ ] Risk shown with icon, word and colour, with window and data age
- [ ] Works at 320 px width and in dark mode
- [ ] Bundle size within budget (`performance.md`)

### Backend
- [ ] `ruff`, `mypy`, `pytest` pass
- [ ] `python manage.py check --deploy` passes with production settings
- [ ] No business logic in views or serializers
- [ ] New or changed endpoints have a permission test matrix (anonymous, other user, owner, staff)
- [ ] Query count test on list endpoints; indexes exist for new filters
- [ ] Migration is additive or follows expand and contract (`database.md`); no applied migration edited
- [ ] OpenAPI schema regenerated; frontend types regenerated
- [ ] Risk rule changes bump `RULES_VERSION` and add boundary tests
- [ ] Agent or prompt changes include a validator test showing unsupported numbers are rejected
