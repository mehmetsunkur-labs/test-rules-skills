I've added `GET /feedback/:id` and `POST /feedback`, but none of it has been run. `npm` isn't on PATH and there's no `node_modules`, so `npm run typecheck && npm test && npm run lint` didn't run. Please run them before merging. Nothing is committed yet.

**What the endpoints do**
- **`GET /feedback/:id`:**
  - Feedback from another company returns 404.
  - Shared feedback is visible to anyone in the same company.
  - Private feedback is visible only to its author, its recipient, and admins. Anyone else gets 403.
- **`POST /feedback`:**
  - The request body has `recipientId`, `body` (1–5000 characters) and an optional `visibility`, which defaults to `private`.
  - The author and company always come from the caller's login. If the body includes `authorId` or `companyId`, they're silently dropped.
  - Success returns 201.
- **Response fields:** only `id`, `authorId`, `recipientId`, `body`, `visibility` and `createdAt`. `company_id` is never returned.

**New and changed files**
- `src/server/repositories/feedback-repository.ts`: the two queries.
- `src/server/routes/feedback.ts`: the routes, plus `canViewFeedback()`, which holds the private/shared rule.
- `src/server/app.ts`: registers the routes under `/feedback`.
- `src/server/routes/feedback.test.ts`: 11 tests covering:
  - the normal cases (private, shared, admin)
  - 403 for someone who isn't allowed
  - 404 for another company's feedback, and for a recipient in another company
  - 400 for a bad id, an empty body and an unknown visibility
  - that `authorId`/`companyId` in the body are ignored

No migration was needed because the `feedback` table already exists.

**Decisions and risks to check**
1. **The recipient must be in the same company, but this relies on a guess about the users table.** The insert checks `users.company_id`. That column isn't defined in any migration here, so I assumed it exists. If it doesn't, the query will fail in production. If the recipient isn't in the caller's company, the endpoint returns 404, so it doesn't reveal whether that user exists.
2. **Unauthorised reads of private feedback get 403, not 404.** That tells a colleague the feedback exists. If you'd rather hide that, it's a one-line change to `NotFoundError`.
3. **Other choices you may want to revisit:**
   - There's no anonymous feedback, because the table has no column for it.
   - Giving feedback to yourself isn't blocked.
   - Feedback text is capped at 5000 characters.

**Rules check**
The `rules-reviewer` agent found one problem I didn't fix, and one I did:
- **Not fixed (R1):** the test's fake database uses `as unknown as Db['query']`, which the rules ban. I copied it from `goals.test.ts`. Removing it needs a typed fake that matches `pg`'s `Pool.query` overloads, and I couldn't check that without the TypeScript compiler. I'd suggest a shared typed fake used by both test files, as a separate change.
- **Fixed (R2):** the response `body` field now has a length limit.

It found nothing else:
- **R3:** the company and user come only from the login, every query filters on the company, and another company's data returns 404.
- **R4:** errors are thrown as the typed ones, and nothing is caught and swallowed.
- **R5:** only the feedback ID is logged, never the text.
- **R6:** queries are parameterized and list their columns explicitly.
- **R7:** all the required test cases are there.
- **R9:** no new dependencies, and nothing copied from `legacy/`.
