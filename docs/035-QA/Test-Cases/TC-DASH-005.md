---
id: TC-DASH-005
type: test-case
status: draft
feature: Dashboard
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-005: Low Stock Alerts

## Pre-conditions

- Logged in as Admin.
- Variants with stock_quantity below threshold (default 10).

## Test Steps

1. Open Dashboard.
2. Check Low Stock widget list.
3. Change threshold if configurable and refresh.

## Expected Result

- Only in_stock variants with stock <= threshold appear.
- Out_of_stock and low stock states display correct badges.
