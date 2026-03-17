---
id: TC-DASH-006
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-006: Recent Activities Feed

## Pre-conditions

- Logged in as Admin.
- At least one new order and one new chat message created recently.

## Test Steps

1. Open Dashboard.
2. Verify recent activities list.
3. Trigger a new order and refresh the dashboard.

## Expected Result

- Recent activities include latest orders and chat notifications.
- New events appear after refresh in correct timestamp order.
