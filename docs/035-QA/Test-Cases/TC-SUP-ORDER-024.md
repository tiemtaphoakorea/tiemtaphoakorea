---
id: TC-SUP-ORDER-024
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-024: Handle Past Expected Dates

## Pre-conditions

- Logged in as Admin.
- Valid product variant exists.

## Test Steps

1. Create order with expectedDate = yesterday.

## Expected Result

- Order is created (validation may allow or reject past dates).
- If allowed: Order exists with past date.
- If rejected: API returns appropriate error.
