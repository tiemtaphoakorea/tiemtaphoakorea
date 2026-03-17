---
id: TC-DASH-008
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-008: Top Customers Widget

## Pre-conditions

- Logged in as Admin.
- Delivered orders exist for multiple customers.

## Test Steps

1. Open Top Customers widget with a time filter.
2. Compare ordering with delivered order totals.

## Expected Result

- Customers are sorted by total spent (desc) for delivered orders.
- Customers with no delivered orders are excluded.
