#!/bin/zsh
SP="$1"
PD="GET /users/:id sometimes returns an empty object instead of an error. Fix it, and also add PUT /users/:id so a user can update their name and email. Add some logging so we can debug user updates in production."
PA="Add API endpoints for feedback: GET /feedback/:id to fetch a single feedback item and POST /feedback to create one. The feedback table already exists (see migrations)."
run() { ( cd "$SP/exp/$1" && claude -p "$2" --permission-mode bypassPermissions > "$SP/exp/$1.out.md" 2> "$SP/exp/$1.err"; git add -A && git diff --cached HEAD > "$SP/exp/$1.diff" ) & }
run D-before "$PD"; run D-after "$PD"; run A2-after "$PA"
wait; echo ALL_DONE
