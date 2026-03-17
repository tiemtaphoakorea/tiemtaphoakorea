---
id: TC-SUP-ORDER-015
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-015: Pre-Order Stock Type Behavior

## Pre-conditions

- Logged in as Admin.
- Product with "pre_order" stock type variant exists.

## Test Steps

1. Record initial stock quantity of pre_order variant.
2. Create supplier order for pre_order variant.
3. Receive the order via API or UI.
4. Check stock quantity via API.

## Expected Result

- Order status is "received".
- Stock quantity does NOT increase (pre_order items don't update stock).
- receivedAt timestamp is set.
