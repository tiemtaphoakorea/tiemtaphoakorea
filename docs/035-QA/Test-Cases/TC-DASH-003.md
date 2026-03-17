---
id: TC-DASH-003
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-003: Order Status Widget Counts

## Pre-conditions

- Logged in as Admin.
- Orders exist across statuses (pending, paid, preparing, shipping, delivered, cancelled).

## Test Steps

1. Open Dashboard.
2. Compare widget counts with order list filters.

## Expected Result

- Counts match the number of orders in each status.
- Links navigate to the correct filtered order list.
