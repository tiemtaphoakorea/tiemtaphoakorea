---
id: TC-DASH-009
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-009: Unread Chat Count Widget

## Pre-conditions

- Logged in as Admin.
- At least one unread chat message exists.

## Test Steps

1. Open Dashboard.
2. Verify unread chat count matches admin inbox unread total.
3. Mark messages as read and refresh.

## Expected Result

- Unread count matches inbox.
- Count decreases after messages are read.
