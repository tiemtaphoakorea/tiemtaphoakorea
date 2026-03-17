---
id: TC-SUP-ORDER-026
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-026: Handle Very Large Quantities

## Pre-conditions

- Logged in as Admin.
- Product with in_stock variant exists.

## Test Steps

1. Record initial stock.
2. Create order with quantity = 10000.
3. Receive the order.
4. Verify stock increased by 10000.

## Expected Result

- Large quantity is handled correctly.
- Stock increases by exact amount.
- No overflow or precision issues.
