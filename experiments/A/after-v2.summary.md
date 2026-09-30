I've added both endpoints, but **none of it has been run**. Node and npm aren't installed in this environment, so `npm run typecheck`, `npm test` and `npm run lint` never ran. Please run them before merging. I haven't committed anything.

**What changed**
- `src/server/repositories/feedback-repository.ts` (new): `findFeedbackById` and `createFeedback`. Every query uses placeholders, lists its columns, filters on `company_id`, and maps rows to a camelCase type (R6, R3). `createFeedback` only inserts if the recipient is a user in the caller's company. Otherwise nothing is written and the endpoint returns 404.
- `src/server/routes/feedback.ts` (new):
  - **`GET /feedback/:id`**: returns 404 for a record that doesn't exist, belongs to another company, or that the caller isn't allowed to see (R3).
  - **`POST /feedback`**: takes `{ recipientId, body, visibility? }` and returns 201. The body must be 1–5000 characters and visibility defaults to `private`.
  - Company and author always come from `request.auth`. If the client sends `companyId` or `authorId`, they are dropped (R3).
  - The response schema only returns listed fields, so `companyId` is never sent back (R2).
  - The only log line is `{ feedbackId }, 'feedback created'`, with no feedback text (R5).
- `src/server/app.ts`: registers the routes under `/feedback`.
- `src/server/routes/feedback.test.ts` (new), 11 cases (R7):
  - successful fetch and create
  - 400 for a malformed id and for an empty body
  - 404 for feedback in another company and for a recipient in another company
  - private feedback: visible to author, recipient and admin; a manager who isn't involved gets 404
  - shared feedback is visible to a colleague
  - client-sent `companyId`/`authorId` are ignored

**Decisions for you to check**
1. **Who can see feedback:** private feedback is visible to its author, its recipient and admins, following the example in the rules. I made shared feedback visible to everyone in the company; that's my reading of `shared`. Managers get no special access because there's no reporting-line data to base it on. The rule is all in `canViewFeedback`, so it's easy to change.
2. **The recipient check assumes `users.company_id` exists.** No migration in the repo defines the `users` table, so I couldn't confirm the column.
3. **Test fake uses `as unknown as Db['query']`.** It's the same cast as the existing `goals.test.ts`, needed because `pg`'s `query` has overloads. It breaks R1's letter; a shared typed fake would fix both files but is outside this task (R9).

**Not verified:** typecheck, tests, lint, and whether the SQL is valid against a real Postgres. I also didn't run the `rules-reviewer` agent.
