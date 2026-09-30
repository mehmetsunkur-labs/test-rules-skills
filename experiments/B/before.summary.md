I added the `FeedbackList` component in `src/web/components/FeedbackList.tsx`. I haven't typechecked or run it because `node_modules` isn't installed, and I didn't add tests.

**What it does**
- Loads feedback from `GET /api/feedback?recipientId=…` using `useQuery` with the key `['feedback', recipientId]`. It shows loading, error and empty states the same way `GoalList` does.
- Shows each item's text and its date, formatted for the current language.
- Each item has a Delete button. It asks for confirmation (the browser's `window.confirm`), then calls `DELETE /api/feedback/:id`. While that runs, the button is disabled and reads "Deleting…".
- When a delete succeeds, the item disappears from the list straight away and the list is reloaded from the server. If it fails, an error message appears above the list.
- It uses the existing `apiFetch` helper, which already copes with a `204` empty response.
- I added a new `feedback.*` section of text to both `en.json` and `de.json`.

**Before this can work**
- **There are no feedback API routes yet.** The server only has goal routes, so both endpoints need building. My feedback fields (`id`, `authorId`, `recipientId`, `body`, `visibility`, `createdAt`) are a guess from `migrations/002_create_feedback.sql` and the naming used by the goal routes.
- **Delete access needs deciding.** The API should filter by `companyId` from the logged-in user, like the goal routes do. It should also check that the user may delete the item: at least that they are the recipient, or maybe only the author or an admin. Otherwise anyone who knows an ID could delete someone else's feedback.
