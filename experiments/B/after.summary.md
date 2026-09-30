I've added `src/web/components/FeedbackList.tsx` and the new text strings, but I couldn't run any checks: `npm` isn't installed here and there's no `node_modules`, so typecheck, tests and lint haven't run.

**The backend doesn't exist yet.** There's no `GET /api/feedback` or `DELETE /api/feedback/:id` route and no feedback repository. Only the database migration is there. Until those are built, the component will show its load-error message. I left the backend out to keep to what you asked for; I can build it with the `add-endpoint` skill.

**What the component does**
- Loads feedback with `useQuery` under the key `['feedback', recipientId]`, and deletes with `useMutation`. A successful delete refreshes that list.
- Handles all four states: loading, error, empty and the list itself.
- Delete asks for confirmation first. Clicking **Delete** swaps in **Yes, delete** / **Cancel** buttons for that item. The confirm button is disabled while the delete is in flight, and a failed delete shows an error message.
- All buttons are real `<button>`s. Dates are formatted for the user's language.
- New strings are under `feedback.*` in both `en.json` and `de.json`, including the private/shared labels. The German wording is mine and should be checked by a native speaker.

**Assumption you need to check:** I guessed the server returns items shaped as `{ id, body, visibility: 'private' | 'shared', createdAt }`, based on the database table. I left out `authorId` on purpose, because anonymous feedback must not reveal its author. The endpoint's response schema needs to match this shape.

**Also left out**
- No component test. The repo has no DOM test environment set up (no jsdom), and adding one means a new dependency, which needs your OK. Say if you want it.
- Nothing is committed. When you want it, the message would be `feat(feedback): add FeedbackList component`.
- Before merging, run `npm run typecheck && npm test && npm run lint` somewhere Node is installed.
