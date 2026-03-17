---
id: TC-INT-006
type: test-case
status: active
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-02-01
linked-to: [[Spec-Order-Management]]
---

# TC-INT-006: Order and Supplier Order Independence

## Pre-conditions

- Logged in as Admin.
- Order with pre_order items exists; order status = paid.
- Supplier_orders (if any) are managed separately and are not linked to the order.

## Test Steps

1. Move order status to "delivered".
2. Separately, update a supplier_order (unrelated to this order) to "received".

## Expected Result

- Order status can move to delivered independently of supplier_orders.
- Supplier order status is managed separately; no gate between order delivery and supplier order received.

## Note

Order and supplier orders are independent; no link between them.

## Related Docs

- [[Spec-Order-Management]]
