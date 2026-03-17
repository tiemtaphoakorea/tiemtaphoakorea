---
id: TC-DASH-004
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-004: Top Products Widget

## Pre-conditions

- Logged in as Admin.
- Delivered orders exist in last 7 days.

## Test Steps

1. Open Top Products widget (7-day filter).
2. Compare top products with delivered order data.

## Expected Result

- Products are ordered by quantity sold (desc) within the selected period.
- Only delivered orders are included.
