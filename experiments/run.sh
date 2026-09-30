#!/bin/zsh
SP="$1"
typeset -A P
P[A]="Add API endpoints for feedback: GET /feedback/:id to fetch a single feedback item and POST /feedback to create one. The feedback table already exists (see migrations)."
P[B]="Create a React component FeedbackList that shows the feedback a user has received (GET /api/feedback?recipientId=...) and lets them delete an item (DELETE /api/feedback/:id)."
P[C]="Goals need a due date. Add due_date to the goals table and return it from the goals API."
for s in A B C; do for v in before after; do
  ( cd "$SP/exp/$s-$v" && claude -p "${P[$s]}" --permission-mode bypassPermissions > "$SP/exp/$s-$v.out.md" 2> "$SP/exp/$s-$v.err" ; \
    git add -A && git diff --cached HEAD > "$SP/exp/$s-$v.diff" ) &
done; done
wait
echo ALL_DONE
