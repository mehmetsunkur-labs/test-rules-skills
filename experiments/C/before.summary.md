I've added `due_date` to the goals table and the goals API now returns it. I couldn't run the type check or the tests because Node and npm aren't installed in this environment, so run `npm run typecheck && npm test` locally before merging.

**Changes:**
- **Migration**: new file `migrations/003_add_goal_due_date.sql` adds a `due_date date` column to `goals`. The column allows empty values, since existing goals don't have a due date, and there's no default.
- **Repository** (`src/server/repositories/goal-repository.ts`): `Goal` now has `dueDate: string | null`. The query converts the date to text so it comes back as `'YYYY-MM-DD'`. Without that, the database driver turns a `date` into a JavaScript `Date` at local midnight, and converting it to a string can shift it to the day before.
- **Route schema** (`src/server/routes/goals.ts`): both `GET /goals/:id` and `GET /goals` now include `dueDate` in the response, as a date string or `null`. This matters because Fastify drops any field that isn't in the response schema.
- **Tests** (`src/server/routes/goals.test.ts`): the existing test now also checks `dueDate: '2026-06-30'`, and a new test checks that `dueDate` is `null` when a goal has no due date.

**Not included (tell me if you want any of it):**
- A way to set the due date: there are no create or update endpoints yet, so nothing writes the new column.
- Showing it in the frontend: `GoalList.tsx` and its local `Goal` type don't display the due date.
- An index on `due_date`, which would only help if you later sort or filter goals by due date.

I haven't committed anything.
