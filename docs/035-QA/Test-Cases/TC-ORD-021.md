---
id: TC-ORD-021
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-021: Manual Supplier Order Received Increases Stock

## Pre-conditions

- Logged in as Admin.
- Variant A exists with stock_type = in_stock and stock_quantity = 0.
- Supplier order exists for Variant A created manually (đơn nhập độc lập), status = pending, quantity = 5.

## Test Steps

1. Update supplier order status to "received".
2. Open Variant A details.

## Expected Result

- Supplier order status becomes received.
- Variant A stock_quantity increases by 5.

## Related Docs

- [[Spec-Order-Management]]
