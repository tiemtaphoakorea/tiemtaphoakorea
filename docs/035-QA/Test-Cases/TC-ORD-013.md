---
id: TC-ORD-013
type: test-case
status: active
feature: Order Management
created: 2026-01-28
updated: 2026-02-01
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-013: Order Status Flow (Order and Supplier Order Independent)

## Pre-conditions

- Logged in as Admin.
- Order with pre_order items exists; order status = pending.

## Test Steps

1. Pay for the order (move from pending to paid).
2. Mark order as delivered (if business allows).

## Expected Result

- Order status transitions: pending → paid → delivered per flow.
- Order status is independent of supplier_orders; supplier orders are managed separately and do not gate order delivery.

## Note

Uses simplified order flow: **pending → paid → delivered**.
Order and supplier orders are independent; no link between them.
