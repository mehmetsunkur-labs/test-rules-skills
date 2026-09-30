I've added both endpoints and tests, but **none of it has been run**. There's no Node, npm or npx on this machine, so `npm install`, `tsc` and `vitest` all failed to start. Please run `npm install && npm run typecheck && npm test` before merging.

**Changed files**
- `src/server/repositories/feedback-repository.ts`: the database queries, in the same style as `goal-repository.ts`.
- `src/server/routes/feedback.ts`: the two routes, with request and response schemas.
- `src/server/app.ts`: registers the routes under `/feedback`.
- `src/server/routes/feedback.test.ts`: tests covering who can read an item, the cross-company cases, input checks, and that clients can't set the author.

**How it behaves**
- **`GET /feedback/:id`**: returns an item only if it's in the caller's company and the caller wrote it or received it. Anyone else gets a 404, so they can't tell whether the item exists. The check is in the SQL query itself.
- **`POST /feedback`**: takes `{ recipientId, body, visibility? }`. `visibility` defaults to `private`. The company and author always come from the caller's token; an `authorId` sent in the body is silently dropped. It returns 201 with the new item.
  - The body must contain some non-space text and be at most 10,000 characters.
  - Giving feedback to yourself returns 400.
  - The recipient must be in the caller's company. The table's foreign key only checks that the user exists, so without this check you could send feedback to someone in another company. If they aren't in the caller's company, the request returns 404.
- Neither response includes `companyId`, matching the goals endpoints. The logger already hides `*.body`, so feedback text won't show up in logs.

**Decisions for you to check**
1. **Who can read feedback.** I let only the author and the recipient read it. `shared` is stored but doesn't give anyone else access yet, because nothing in the schema says who a person's manager is. If `shared` should let managers or admins read it, the query in `findFeedbackForUser` needs changing.
2. **The `users` table.** The recipient check assumes `users` has a `company_id` column. I couldn't confirm this because there's no migration for `users` in this repo.
3. **Self-feedback and the 10,000-character limit** were my own calls. Remove them if you don't want them.
