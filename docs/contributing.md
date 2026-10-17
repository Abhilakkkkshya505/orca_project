# Contributing

Applies to humans and AI agents. Read `ignore.md` first. It lists what will get a PR rejected.

## 1. Workflow

1. Open or pick an issue. State the user-visible outcome in one sentence.
2. Branch from `main`.
3. Make a small, focused change with tests.
4. Run the local checks (section 5).
5. Open a PR using the template. Fill in the pre-merge checklist from `ignore.md`.
6. One approving review is required. Safety-relevant changes (`apps/risk/`, `apps/agents/validators.py`, prompts, thresholds, advisory parsing) need a second reviewer.
7. Squash merge. The PR title becomes the commit message.

`main` is always deployable. No direct pushes to `main`.

## 2. Branch names

`<type>/<short-description>` in lowercase with hyphens, and an issue number if one exists.

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `security`.

Examples: `feat/advisories-table-sorting`, `fix/123-stale-wave-data-level`, `security/access-jwt-audience-check`.

## 3. Commit and PR title convention

Conventional Commits:

```
<type>(<scope>): <summary in imperative mood, under 72 characters>
```

Scopes: `backend`, `frontend`, `risk`, `agents`, `geodata`, `auth`, `chat`, `map`, `offline`, `infra`, `docs`, `ci`.

Examples:
- `feat(risk): mark wave data older than limit as unknown`
- `fix(auth): return same response for existing email on signup`
- `docs(deployment): add Tunnel token rotation steps`

Body (optional): why the change is needed and anything surprising. Reference issues with `Refs #123` or `Fixes #123`.

Breaking API change: add `!` after the scope and a `BREAKING CHANGE:` line, and follow the versioning rule in `api.md`.

## 4. Code style

### Backend
- `ruff check` and `ruff format` (single tool for lint and format, no black).
- `mypy` with `django-stubs`. Strict for `apps/risk`, `apps/agents`, `apps/core`.
- Type hints on public functions. No `Any` without a reason in a comment.
- Services in `services.py`, no logic in views or serializers.
- Imports sorted by ruff. No wildcard imports.
- Names: `snake_case` for functions and variables, `PascalCase` for classes. Boolean names read as questions (`is_active`, `has_advisory`).
- Migrations follow `database.md`.

### Frontend
- ESLint (strict type-checked config, hooks and a11y plugins) and Prettier. CI fails on any error.
- TypeScript strict, no `any`, no `@ts-ignore`.
- Components `PascalCase.tsx`, hooks `useThing.ts`, utilities `kebab-case.ts`.
- One component per file unless tiny and private. Components under 200 lines.
- Server data through TanStack Query. Forms through react-hook-form and Zod.
- Colours, spacing and type come from design tokens only.
- User-visible strings go through `t()`.

### Both
- Comments explain why, not what.
- No dead code, no commented-out code, no `TODO` without an issue number.
- Error handling is explicit. No swallowed exceptions.
- Docs change in the same PR as behaviour.

## 5. Local checks before opening a PR

Backend:

```bash
ruff check . && ruff format --check .
mypy .
pytest
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file schema.yml --validate
```

Frontend:

```bash
pnpm lint && pnpm typecheck && pnpm test --run
pnpm build
pnpm api:generate && git diff --exit-code
```

Optional but encouraged: `pre-commit install`. The pre-commit config runs ruff, prettier, gitleaks and file hygiene hooks.

## 6. PR template

```markdown
## What and why
<one paragraph: the change and the reason>

## How to test
<steps a reviewer can follow>

## Safety impact
- [ ] Does not touch risk logic, prompts, thresholds or advisory parsing
- [ ] Or it does, and: tests added, RULES_VERSION bumped if needed, second reviewer requested

## Screenshots
<before and after, light and dark, mobile width, for UI changes>

## Checklist
<paste the pre-merge checklist from docs/ignore.md and tick it>
```

## 7. Review guidelines

Reviewers check, in this order:
1. Does it do what the issue says, and nothing extra?
2. Can it make ORCA say "safe" when it should not? (Missing data, stale data, boundary values.)
3. Permissions and data exposure.
4. Tests: do they fail without the change?
5. Banned patterns from `ignore.md`.
6. Readability and naming.
7. Accessibility and performance for UI changes.

Be specific and kind in comments. Explain the reason. Authors respond to every comment with a fix or a short reason.

## 8. Dependencies

- Add with a reason in the PR description: what it does, why not existing code, size and maintenance status, licence.
- Verify the package name and version on the registry. Do not copy names from memory or from AI output without checking.
- Pin through the lockfile.
- Remove dependencies you stop using in the same PR.

## 9. Documentation changes

- Update the relevant doc in `docs/`.
- Add user-visible changes to `CHANGELOG.md` under `Unreleased`.
- New environment variables go in `.env.example`, `deployment.md` and the README pointer if needed.
- New endpoints go in `api.md` and the permission matrix.

## 10. Releases

- Semantic Versioning for tags (`v0.1.0`). Pre-1.0 means breaking changes can happen in minor versions, and they are noted in the changelog.
- Release steps: update `CHANGELOG.md` (move `Unreleased` to the new version with a date), tag, deploy through CI, verify health and data status, announce.
- Security fixes are released as soon as tested, with a short changelog note that does not give exploit details.

## 11. Reporting security issues

Do not open public issues for vulnerabilities. Email the security contact listed in the repository (placeholder: `security@orca.example`, to be set by the project owner). Include steps to reproduce and impact. Acknowledgement within 3 working days is the goal.

## 12. Working with AI coding agents

- Point the agent at `CLAUDE.md` and `ignore.md` at the start of a task.
- Review AI-written code as strictly as any other. Check imports, package names and API calls actually exist.
- Do not paste secrets, real user data or private keys into an agent.
- If an agent suggests relaxing a rule in `ignore.md`, the answer is no unless the rule is changed in its own PR.
