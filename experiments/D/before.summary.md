I fixed GET, added PUT and added logging, but none of it has been run. Node isn't installed on this machine, so I couldn't typecheck or run the tests. Please run `npm install && npm run typecheck && npm test` before merging.

**Why GET returned `{}`:** in the old route, a database error was caught and answered with `200 {}`, and a missing user returned `undefined`. The same code had worse problems:
- **SQL injection:** the SQL was built by pasting `request.params.id` straight into the query string.
- **No company check:** any company's user could read any user.
- **Token logging:** `console.log` wrote out the request headers, including the bearer token.
- **Too much data:** `SELECT *` returned every column.

**What I changed:** I replaced `src/server/routes/legacy/users.ts` with `routes/users.ts` plus a new `repositories/user-repository.ts`, following the same pattern as `goals`. This is effectively the PULSE-412 rewrite.
- **GET /users/:id** now uses a parameterized query limited to the caller's company. A missing user (or one in another company) gets a 404, a non-UUID id gets a 400, and database errors go to the shared error handler as a 500. It returns `{ id, name, email, createdAt }`.
- **PUT /users/:id** accepts `{ name?, email? }` with at least one field, and checks lengths and email format. Users can only update themselves; anyone else gets a 403. An email that's already taken gets a 409, but that only works if `users.email` has a unique constraint.
- **Logging** goes through Fastify's `request.log`, so each line carries the request ID. For every update it records the target user ID and which fields changed, and logs the outcome: requested, updated, forbidden, not found or conflict. It never logs the name or email values themselves, since those are personal data.
- **Tests:** `routes/users.test.ts` covers the cases above.

**Decisions for you:**
1. **`users` table columns:** there's no migration for `users` in the repo, so I assumed it has `id, company_id, name, email, created_at`. If the columns are named differently, the repository queries need adjusting.
2. **Response shape:** GET used to return every column and now returns four fields. Nothing in `src/web` calls `/users`, but an outside consumer might rely on the old fields.
3. **Who can update:** only users updating themselves are allowed. If admins should be able to edit users in their own company, that's a one-line change to the permission check.
4. **Unknown body fields:** fields like `role` are silently dropped, not rejected, because of Fastify's default validation settings.
