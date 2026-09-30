---
paths:
  - "src/server/**/*.ts"
---

# R5 — Logging & PII

- Use `request.log` (inside handlers) or `app.log` — the Pino logger. **No `console.*`** in server code.
- Log structured objects with a static message: `request.log.info({ feedbackId }, 'feedback created')` — not string interpolation.
- Log **IDs, never content**: no emails, names, feedback/review text, tokens, headers, or full request bodies. This is HR data covered by GDPR; logs are shipped to a third-party vendor.
- Errors: `request.log.error({ err }, '...')` so Pino serializes the stack. Don't log-and-rethrow (double logging); let the error handler log.
- New sensitive fields must be added to the logger `redact` list in `src/server/app.ts`.
