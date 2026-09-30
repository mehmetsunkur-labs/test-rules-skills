I added `due_date` to the goals table and both goals endpoints now return it as `dueDate`. I couldn't run any checks: this machine has no `node` or `npm`, so `npm run typecheck && npm test && npm run lint` never ran. None of this has been type-checked, tested or linted.

**What changed**
- **`migrations/003_add_goals_due_date.sql`** (new file): adds a `due_date date` column. It allows empty values, so existing goals and the currently running app version keep working. I left `001` as it is, since migrations are only ever added. It isn't a foreign key, so it doesn't need an index.
- **`src/server/repositories/goal-repository.ts`**: adds `dueDate: string | null` to `Goal` and `due_date` to `GoalRow`. The column is read as `due_date::text`, because otherwise `pg` turns a `date` into a JS `Date` at local midnight. On a server outside UTC, `toISOString()` would then return the wrong day. With the cast, the API always gets a plain `YYYY-MM-DD` string.
- **`src/server/routes/goals.ts`**: the response schema allows `dueDate` as a `YYYY-MM-DD` date or `null`. This applies to both `GET /goals/:id` and `GET /goals?ownerId=`.
- **`src/server/routes/goals.test.ts`**: the existing happy-path test now checks `dueDate: '2026-12-31'`. A new test checks that a goal without a due date returns `dueDate: null`.

**Not verified**
- Typecheck, tests and lint: none of them ran.
- The migration hasn't been run against Postgres.
- The tests use a fake database, so they don't exercise the `::text` cast. It's standard Postgres, but it hasn't been checked against a real database.

**Deliberately left out**
- You can't set a due date yet, because there are no create or update endpoints for goals. That's a separate endpoint task.
- `GoalList.tsx` doesn't show the due date. Displaying it would need `Intl` date formatting and new keys in `en.json` and `de.json`.

I haven't committed anything. Once the checks pass, I'd suggest the commit message `feat(goals): add due_date to goals and expose it in the API`.
