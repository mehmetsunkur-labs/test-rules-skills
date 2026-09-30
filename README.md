# Task 1: Personal ruleset, skill and custom agent (Claude Code)

A test repo, **Pulse**, standing in for the kind of HR SaaS service I work on: TypeScript, Fastify + TypeBox, Postgres, React + TanStack Query, multi-tenant, employee PII. It contains 10 custom rules, one skill and one custom agent. The before/after examples come from real headless Claude Code runs, not made-up ones.

## What's in the repo

| Feature | File | Loaded when |
|---|---|---|
| Always-on rules (R1, R9, R10) | `CLAUDE.md` | Every session |
| API rules (R2, R3, R4) | `.claude/rules/api.md` | Touching `src/server/**` |
| Logging & PII (R5) | `.claude/rules/security-logging.md` | Touching `src/server/**` |
| DB & migrations (R6) | `.claude/rules/data-access.md` | Touching `repositories/**`, `migrations/**` |
| Testing (R7) | `.claude/rules/testing.md` | Touching `*.test.ts(x)`, `routes/**` |
| Frontend (R8) | `.claude/rules/frontend.md` | Touching `src/web/**` |
| **Skill** `add-endpoint` | `.claude/skills/add-endpoint/SKILL.md` | Auto-triggers on "add an endpoint…", or `/add-endpoint` |
| **Custom agent** `rules-reviewer` | `.claude/agents/rules-reviewer.md` | Read-only reviewer that checks a diff against R1–R10 |
| Evidence | `experiments/<scenario>/{before,after}.{diff,summary.md}` | Raw diffs and agent summaries |

Path-scoped rules keep context small: the frontend rules never load while the agent edits SQL.

## The 10 rules

| ID | Rule | Common mistake it prevents |
|---|---|---|
| R1 | Strict TS: no `any`, no `as unknown as`, no `!`; exported functions declare their return type; model states as literal unions | Casts that hide null bugs; `status: string` |
| R2 | Every route has a TypeBox schema for params/query/body **and response**; responses are an allow-list | Returning raw DB rows that leak `company_id` or an anonymous author |
| R3 | `companyId`/`userId` only from `request.auth`; every SQL statement filters `company_id`; **can't see it → 404, can see but can't act → 403**; access policy lives in one `canX()` function | Cross-tenant data leaks and existence leaks; the most expensive bug in multi-tenant SaaS |
| R4 | Throw typed `AppError`s; one central handler; no empty or log-and-continue `catch` | `catch (e) { reply.send({}) }` (it's in our legacy code) |
| R5 | Pino via `request.log`, structured, **IDs only, never content/PII**; new sensitive fields go into the `redact` list | Logging emails and feedback text to a third-party log vendor (GDPR) |
| R6 | Parameterized SQL in repositories only; explicit columns; no N+1; **migrations are append-only** and safe to deploy alongside the old version | SQL injection; editing `001_*.sql`; `NOT NULL` columns that break rolling deploys |
| R7 | `app.inject()` contract tests; required cases: happy path, 400, cross-tenant 404, authorization denial; tests named by behaviour | Happy-path-only tests |
| R8 | TanStack Query (not `useEffect`+`fetch`); every string through `t()` in **en + de**; `<button>` not `<div onClick>`; confirm destructive actions | Hard-coded English; inaccessible UI; stale lists after a mutation |
| R9 | Stay in scope; **ask before adding a dependency**; never copy from `routes/legacy/` | Drive-by refactors; surprise `npm install`s; the agent copying the worst code in the repo |
| R10 | Run typecheck/test/lint before saying "done"; if you can't, say so; regression test for every fix; Conventional Commits; end with what was and wasn't verified | "All tests pass" when nothing was run |

## How I tested it

`experiments/run.sh` and `run2.sh` copy the repo into isolated directories and run the **same natural-language prompt** with `claude -p` twice. The only difference between the two copies is whether `CLAUDE.md` and `.claude/` exist. The prompts never mention the rules. I kept the resulting diffs and final messages.

| # | Prompt (abridged) | Designed to test |
|---|---|---|
| A | "Add GET /feedback/:id and POST /feedback" | R2–R5, R7 |
| B | "Create a React FeedbackList with delete" | R8, R9 |
| C | "Add due_date to goals and return it from the API" | R6 migrations |
| D | "GET /users/:id sometimes returns `{}`, fix it; add PUT /users/:id; add logging for debugging" | Legacy code, R4, R5, R6, R10 |

## Results

### The honest headline
**The baseline was already strong.** The repo has a clean reference implementation (`goals.ts`), and the model copied its patterns without being told: TypeBox schemas, `company_id` filters, 404 for another company's data, parameterized SQL, `useQuery`, `t()`. In D it even spotted and removed the SQL injection in the legacy code with no rules at all. **Good example code is itself the strongest "rule".**

What the rules added was **team-specific policy the model can't infer from code**, consistency, and self-verification. In one case my own rule made the result *worse* until I fixed it.

### A: feedback endpoints

| | Before (no rules) | After (rules) |
|---|---|---|
| Access policy | Hard-coded in SQL: `AND (author_id = $3 OR recipient_id = $3)`. Admins and `shared` visibility aren't considered | A named `canViewFeedback(auth, feedback)` covering author, recipient, admin and shared, with a test for each (R3) |
| Logging | None | `request.log.info({ feedbackId: feedback.id }, 'feedback created')`, the ID only (R5) |
| Repository signature | `createFeedback(db, { companyId, … })` | `createFeedback(db, companyId, input)`, with the tenant as the first argument (R3) |
| Self-review | None | Ran the `rules-reviewer` agent on its own diff. It fixed an R2 gap (unbounded response `body`) and flagged an R1 cast inherited from `goals.test.ts` |
| **Regression** ⚠️ | Unauthorised colleague → **404** | Round 1: unauthorised colleague → **403**, which reveals the feedback exists |

The 403 came from a bug in my rules. R3 said "don't reveal it exists", but R7 asked for "the forbidden case", and the agent followed R7. I added one line to R3 (**"Can't see it → 404. Can see it but may not act → 403"**) and re-ran it (`experiments/A/after-v2.*`):

```ts
// after-v2: Not allowed to see it → same 404 as a missing or cross-tenant record (R3).
if (!feedback || !canViewFeedback(request.auth, feedback)) throw new NotFoundError('Feedback')
```

### B: React FeedbackList

| | Before | After |
|---|---|---|
| Data fetching, i18n (en+de), a11y roles | ✅ Already good (copied from `GoalList.tsx`) | ✅ Same |
| Client type | Includes `authorId` | **Leaves out `authorId`**, noting that "anonymous feedback must not reveal its author" (came from the R2 wording) |
| Delete confirmation | `window.confirm()` | Inline, translatable Confirm/Cancel buttons |
| Component test | Silently skipped | Skipped **and explained**: needs jsdom, "adding one means a new dependency, which needs your OK" (R9) |
| Hand-off | Summary | Offered to build the backend with the `add-endpoint` skill, and gave a Conventional Commit message |

### C: add `due_date`
**Almost identical.** Both added a new nullable `003_*.sql` migration and never edited `001`. Both cast `due_date::text` to avoid timezone shifts, and both added a null test. The rules only added explicit reasoning ("existing goals and the currently running app version keep working"), a clearer "Not verified" list, and a commit message. This is a case where the rule wasn't needed for this model.

### D: legacy bug + PUT + "add some logging"

| | Before | After |
|---|---|---|
| Root cause, SQL injection, tenant filter | ✅ Found and fixed | ✅ Found and fixed |
| Logging | IDs and field names only ✅ | IDs only ✅, **plus added `*.name` to the Pino `redact` list** (R5) |
| Policy | Inline `if (userId !== id)` → 403, even for another company's users | Named `canUpdateUser()`. **404 for another company, 403 for a colleague**, both tested (R3 v2) |
| Regression test | Tests exist | Tests named "returns 404 **instead of an empty body**…", framed as regressions that fail on the old code (R10) |
| Commits | Not mentioned | Split into two logical Conventional Commits: `fix(users)…` + `feat(users)…` (R10) |
| Rule exceptions | n/a | Admits the one place it broke R1 (a test cast) and why |

## Lessons learned
1. **Rules encode decisions, not skills.** The model already knows how to write parameterized SQL. What it can't know is *our* 404-vs-403 policy, that admins can see private feedback, that we ship German, or that we log to a third party. Put those decisions in rules; skip generic advice.
2. **Test your rules like code.** My rules had two contradictory lines, and that caused a real security regression (the 403 existence leak). One before/after run found it.
3. **Reference code beats prose.** "Copy `goals.ts`, never `legacy/`" did more work than any paragraph.
4. **Give every rule a "why".** The agent used the reasons to handle cases the rule didn't spell out (e.g. leaving out `authorId` for anonymity).
5. **Path scoping** keeps each session to the rules it needs, and rule IDs make reviews and summaries traceable ("R3: …").
6. **Skills and agents close the loop.** The skill turns the rules into a checklist, and the reviewer agent checks the output against them. In A it caught a real gap before hand-off.

**Caveats:** one run per variant, with Claude Opus 5.5, on a small and clean codebase with no Node installed. So nothing was executed, and every agent said so, including without rules. On a messy real codebase, or with a weaker model, the gap would probably be wider.

## Inspirations

**[awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)**
- *TypeScript (Node.js, React, Vite)*: the "strict types, no `any`" section became R1.
- *TanStack Query v5*: "server state belongs in Query, invalidate on mutation" became R8.
- *Vitest Unit Testing*: behaviour-named tests and co-located files became R7.
- *PR Review (security / performance / tests / architecture)*: the checklist shape of the `rules-reviewer` agent.
- *DevSecOps, SSDLC, and AppSec*: input validation and no secrets in logs, which became R2 and R5.
- *Git Commit Messages* (Conventional Commits): R10.
- *Anti-Sycophancy Code Discipline*: "don't claim success you didn't verify" became R10.

**[skills.sh](https://skills.sh/)**
- `obra/superpowers` → *test-driven-development*, *systematic-debugging*: the "regression test that fails without the fix" rule.
- `mattpocock/skills` → *code-review*, *writing-great-skills*: step-by-step skill format with a precise trigger `description`, used in `add-endpoint`.
- `vercel-labs/agent-skills` → *vercel-react-best-practices*, *web-design-guidelines*: the accessibility items in R8.
- `anthropics/skills` → *frontend-design*: pairs well with R8 for UI work.

What I did *differently* from those collections: they are generic, stack-wide advice. Mine are about 10 short, project-specific decisions, each with a rule ID and a "why". Path scoping keeps them out of irrelevant sessions.

## Try it yourself
```bash
claude                     # in this folder; CLAUDE.md + rules load automatically
> /add-endpoint add DELETE /feedback/:id
> use the rules-reviewer agent to check my changes
./experiments/run.sh <scratch-dir>   # re-run the before/after experiment (edit paths first)
```
The rules work in other tools too: `CLAUDE.md` maps to `AGENTS.md` / `.github/copilot-instructions.md`, and `.claude/rules/*.md` with `paths:` maps to Cursor's `.cursor/rules/*.mdc` with `globs:`.
