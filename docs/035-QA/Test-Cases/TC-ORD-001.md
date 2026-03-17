---
id: TC-ORD-001
type: test-case
status: active
feature: Order Management
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-001: Create & Process Order

## Pre-conditions

- Logged in as Staff.
- Generic Customer "Walk-in" exists.
- Product "Test T-Shirt" has +1 Stock.

## Test Steps

1. Navigate to "Orders" > "New Order".
2. Select Customer "Walk-in".
3. Add "Test T-Shirt" to cart.
4. Set Status to "Paid".
5. Save Order.
6. Change Status to "Delivered".

## Expected Result

- Order created with unique ID.
- Inventory for "Test T-Shirt" decreases by 1.
- Payment status (derived from paid_amount) shows "Unpaid" (unless payment added).
