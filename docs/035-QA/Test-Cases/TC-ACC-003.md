---
id: TC-ACC-003
type: test-case
status: draft
feature: Accounting
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-003: Profit Calculation Uses Snapshot Cost

## Pre-conditions

- Logged in as Admin.
- Existing order with cost_price_at_order_time = 80,000.
- Current variant cost_price is now 100,000.

## Test Steps

1. Open profit detail for the existing order.

## Expected Result

- Profit calculation uses cost_price_at_order_time (80,000), not current cost_price.
