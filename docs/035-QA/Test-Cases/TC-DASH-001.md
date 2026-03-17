---
id: TC-DASH-001
type: test-case
status: active
feature: Dashboard
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-001: Dashboard Metrics Verification

## Pre-conditions

- Logged in as Owner.
- Known test data: 3 delivered orders (100k, 200k, 300k = 600k total).

## Test Steps

1. Navigate to Dashboard.
2. Verify "Today's Revenue" displays correct value.
3. Verify "Total Orders" count matches.
4. Check Revenue Chart displays data points.
5. Navigate to "Low Stock Alerts".
6. Verify products with stock < threshold appear.

## Expected Result

- Metrics match expected calculated values.
- Charts render without errors.
- Low stock alerts display accurate product list.
