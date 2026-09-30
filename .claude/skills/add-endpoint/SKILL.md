---
name: add-endpoint
description: Scaffold a new tenant-scoped REST endpoint (repository + TypeBox route + tests) following the project rules R2–R7. Use when the user asks to add, create or expose an API endpoint, route, or CRUD operation in src/server.
---

# Add an endpoint

Follow these steps in order. Use `src/server/routes/goals.ts` and `src/server/repositories/goal-repository.ts` as the reference implementation. Never use `routes/legacy/`.

1. **Clarify the contract** (ask only if it is genuinely ambiguous): method, path, who may call it, what a caller from another company sees (always 404), and the authorization rule within a company.
2. **Migration** (only if the schema changes): add the next numbered file in `migrations/`. Never edit an existing one. Nullable/defaulted columns, index on `(company_id, …)`.
3. **Repository** in `src/server/repositories/<entity>-repository.ts`:
   - `export async function verbEntity(db: Db, companyId: string, …): Promise<Entity | undefined>`
   - Parameterized SQL, explicit `COLUMNS`, `WHERE company_id = $1`, a `toEntity(row)` mapper.
4. **Route** in `src/server/routes/<entity>.ts` as a `FastifyPluginAsyncTypebox`:
   - `schema` with `params` / `querystring` / `body` / `response` (allow-list the fields).
   - Take `companyId` / `userId` from `request.auth` only.
   - Put authorization in a named function (`canViewFeedback(auth, feedback)`) and throw `NotFoundError` / `ForbiddenError`.
   - Log IDs only: `request.log.info({ id }, '<entity> created')`.
5. **Register** the plugin in `src/server/app.ts` with a prefix.
6. **Tests** in `src/server/routes/<entity>.test.ts` using `buildApp()` + `app.inject()`. Required cases:
   - happy path
   - 400 on invalid input
   - 404 for a record in another company
   - the in-company authorization rule, if any: 404 if the caller must not learn the record exists, 403 only if they can read it but not perform the action
7. **Verify**: `npm run typecheck && npm test && npm run lint`. Report the output. If you could not run something, say so.
8. **Summarise** with the rule IDs you applied, e.g. "R3: all queries filter by company_id".
