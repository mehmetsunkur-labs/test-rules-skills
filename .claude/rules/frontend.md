---
paths:
  - "src/web/**/*.ts"
  - "src/web/**/*.tsx"
---

# R8 — Frontend (React)

**Server state**
- Server data goes through TanStack Query (`useQuery` / `useMutation`) and `apiFetch` — never `useEffect` + `fetch` + `useState`.
- Mutations invalidate the affected query keys (`queryClient.invalidateQueries({ queryKey: ['feedback', userId] })`).
- Handle all states: pending, error, empty, success.

**i18n** — we ship in 12 languages
- No hard-coded user-visible strings (text, `aria-label`, `placeholder`, `title`, alt). Use `t('area.key')` and add the key to **both** `src/web/locales/en.json` and `de.json`.
- Dates/numbers via `Intl` with the active locale, never manual formatting.

**Accessibility** — enterprise customers audit us against WCAG 2.1 AA
- Interactive elements are `<button>` / `<a>`, never `<div onClick>`.
- Icon-only buttons need an `aria-label`; every input has a `<label>`.
- Loading → `role="status"`, errors → `role="alert"`.
- Destructive actions (delete) require confirmation.
