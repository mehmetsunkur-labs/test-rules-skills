---
paths:
  - "src/server/repositories/**/*.ts"
  - "migrations/**"
---

# R6 — Database access & migrations

**Queries**
- Parameterized queries only (`$1, $2`). Never build SQL with template literals from input — the only interpolation allowed is constant column lists like `COLUMNS`.
- SQL lives in `src/server/repositories/*-repository.ts`; route handlers never call `db.query` directly.
- Select explicit columns (no `SELECT *`) and map `snake_case` rows to camelCase domain types with a `toX(row)` function.
- No N+1: fetch lists with one query (`WHERE id = ANY($2)` / a join), not a query per item.

**Migrations**
- Migrations are **append-only**. Never edit a migration that exists on `main` — add the next numbered file (`003_...sql`).
- Changes must be safe while the old app version is still running: add columns as nullable (or with a default), backfill separately, drop in a later release.
- Add an index for every new foreign key / `company_id`-leading lookup.
