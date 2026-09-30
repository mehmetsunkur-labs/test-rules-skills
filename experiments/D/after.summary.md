I fixed `GET /users/:id` and added `PUT /users/:id` with logging, but I couldn't run any checks: Node and npm aren't installed here. Typecheck, tests and lint are all unrun, so please run `npm run typecheck && npm test && npm run lint` before merging. Nothing is committed.

**Why GET returned `{}`:** in `routes/legacy/users.ts`, any database error was caught and answered with `reply.send({})`, a 200 with an empty object. A non-UUID id makes Postgres throw, so those requests got `{}`. A missing user returned `undefined` instead of a 404. The same handler also had three more serious problems:
- It built the SQL from the raw id, so it was open to SQL injection.
- It didn't filter by company, so it could return another company's user.
- It returned every column of the row and logged request headers with `console.log`.

**What changed:**
- **Replaced the legacy route** with `src/server/routes/users.ts`, following the `goals.ts` pattern (R9). `GET /users/:id` now gives 400 for a bad id, 404 if the user doesn't exist or is in another company, and a real 500 for database errors (R2, R3, R4). `legacy/users.ts` is deleted.
- **Added `src/server/repositories/user-repository.ts`** with `findUserById` and `updateUser`. Both use parameterized SQL, name their columns explicitly and filter on `company_id`, including the `UPDATE` (R6).
- **`PUT /users/:id`** takes `{ name, email }`, both required. The name must be 1–200 characters and the email a valid address up to 254 characters; other fields are rejected. Callers can only update themselves (`canUpdateUser`). A colleague in the same company gets 403, since they can already read the user; a caller from another company gets 404 (R3).
- **Logging:** successful updates log `'user updated'` and refused ones log `'user update forbidden'` as a warning. Both entries contain only the target user's id and the caller's id, never names or emails. I also added `*.name` to the logger's redact list (R5). One side effect: any logged field called `name` is now hidden, including an error's `name`, though the error type still appears.
- **Tests** in `src/server/routes/users.test.ts` (R7, R10). There are regression tests for the GET bug (404, 400, 500 and cross-company 404) that should fail against the old code. PUT has tests for success, invalid email, missing field, another company (404) and a colleague (403).

**Assumptions and gaps to check:**
- **Column names:** the `users` table isn't defined in `migrations/`, so I assumed it has `id, company_id, name, email`. If the real names differ, the queries need adjusting.
- **GET response is smaller:** it now returns only `{ id, name, email }`. Before, it returned every column, so check whether any client relied on other fields. Nothing in `src/web` calls this endpoint.
- **Admins can't edit other users.** You asked for users updating their own details, so I kept it self-only. Adding admins is a one-line change in `canUpdateUser`.
- **Duplicate emails:** if `email` has a unique constraint, a clash currently returns a 500. I didn't map it to a 409 because I don't know the schema.
- **One rule exception in the tests:** the fake database uses `as unknown as Db['query']`, which R1 forbids. It copies the existing `goals.test.ts`, because the overloaded `pg` query type can't be faked without a cast.

Suggested commits (two logical changes, not made):
- `fix(users): return errors from GET /users/:id instead of an empty object`
- `feat(users): add PUT /users/:id for updating own name and email`
