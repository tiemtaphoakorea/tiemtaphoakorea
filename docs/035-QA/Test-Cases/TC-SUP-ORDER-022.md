---
id: TC-SUP-ORDER-022
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-022: Validate Quantity Constraints

## Pre-conditions

- Logged in as Admin.
- Valid product variant exists.

## Test Steps

1. POST with quantity = 0.
2. POST with quantity = -5 (negative).

## Expected Result

- Zero quantity: Returns 400 Bad Request.
- Negative quantity: Returns 400 Bad Request.
- No order is created for invalid quantities.
