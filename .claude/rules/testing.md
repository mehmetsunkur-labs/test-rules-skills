---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/server/routes/**/*.ts"
---

# R7 — Testing

- Vitest. Tests sit next to the code: `goals.ts` → `goals.test.ts`.
- API tests go through `buildApp()` + `app.inject()` — test the HTTP contract (status, body shape), not handler internals.
- Every new endpoint gets at minimum: happy path, validation failure (400), **cross-tenant access (404)**, and — if there is an authorization rule — the denied case (404 when the caller must not know it exists, 403 only when they can see it but not act, see R3).
- Name tests by behaviour: `it('returns 404 for feedback from another company')`, not `it('works')`.
- Fake only the boundary you don't own (the DB via a fake `Db`, `fetch`). Don't mock our own modules.
- No snapshot tests for API responses; assert on the fields that matter.
