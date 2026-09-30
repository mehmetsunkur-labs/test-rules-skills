# Pulse — feedback & goals service

HR SaaS: Fastify 5 + TypeBox API (`src/server`), React 18 + TanStack Query UI (`src/web`), Postgres via `pg`.
Every row of data belongs to exactly one **company** (tenant). Customers are HR departments; the data is employee PII.

## Commands
- `npm run typecheck` · `npm test` · `npm run lint` · `npm run migrate`

## Rules that always apply
Rule IDs (R1–R10) are referenced in reviews and commit messages. Path-specific rules load from `.claude/rules/`.

### R1 — Strict TypeScript, no escape hatches
- No `any`, no `as unknown as X`, no non-null `!`. Use `unknown` + narrowing, or fix the type.
- Exported functions declare their return type.
- Model states with discriminated unions / literal types (`'private' | 'shared'`), not free-form strings or booleans pairs.
- Why: `tsconfig` is strict with `noUncheckedIndexedAccess`; casts are how our production null-pointer bugs got in.

### R9 — Stay in scope; don't add dependencies silently
- Change only what the task needs. No drive-by refactors, renames, or reformatting of untouched code.
- Do not add an npm dependency without asking first — say which one and why the existing stack can't do it.
- `src/server/routes/legacy/` is pre-convention code. **Never copy patterns from it.** Copy from `routes/goals.ts` instead.

### R10 — Definition of done
- Run `npm run typecheck && npm test && npm run lint` before saying a task is finished. If you cannot run them, say so explicitly — never claim "tests pass" without output.
- Every bug fix ships with a regression test that fails without the fix.
- Commits use Conventional Commits (`feat(feedback): …`, `fix(goals): …`), one logical change per commit.
- End with a short summary: what changed, what you verified, what you did **not** verify.
