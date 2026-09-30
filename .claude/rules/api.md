---
paths:
  - "src/server/**/*.ts"
---

# API rules (Fastify)

### R2 — Validate every boundary with TypeBox
- Every route declares `schema` for `params`, `querystring`, `body` **and** `response` (per status code). Use the `FastifyPluginAsyncTypebox` type so handler inputs are inferred — never annotate `request: any`.
- IDs are `Type.String({ format: 'uuid' })`; bound strings (`maxLength`) and numbers (`minimum`/`maximum`).
- Response schemas are an allow-list: they stop internal columns (`company_id`, author of anonymous feedback) from leaking. Never return a raw DB row.

### R3 — Tenant isolation is non-negotiable
- `companyId` and the acting `userId` come **only** from `request.auth`. Never accept them from body, query, params or headers.
- Every repository function takes `companyId` as its first data argument and every SQL statement filters on `company_id` (including `UPDATE`/`DELETE`).
- A record from another company is a **404**, not a 403 — don't reveal it exists.
- Check authorization on top of tenancy: e.g. private feedback is only visible to its author and recipient (and admins). Put the rule in one function (`canViewX(auth, x)`) and test it.
- **Can't see it → 404. Can see it but may not act → 403.** A colleague asking for someone else's private feedback gets `NotFoundError`, exactly like a cross-tenant request. Use `ForbiddenError` only when the caller can already read the resource (e.g. may read but not delete).

### R4 — Errors: typed, central, never swallowed
- Throw `NotFoundError` / `ForbiddenError` / `AppError` from `src/server/errors.ts`; the central `errorHandler` maps them to HTTP. Don't call `reply.status(4xx)` for domain errors in handlers.
- No empty or log-and-continue `catch`. Only catch an error you can handle or enrich (`throw new AppError(..., { cause })`).
- Never send stack traces, SQL, or internal messages to the client.
