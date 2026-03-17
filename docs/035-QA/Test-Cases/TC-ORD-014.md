---
id: TC-ORD-014
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-014: Supplier Order Received Updates Stock

## Pre-conditions

- Logged in as Admin.
- Variant A: stock_type = in_stock, stock_quantity = 5.
- A supplier_order exists for Variant A with quantity = 4, status = pending.

## Test Steps

1. Open Supplier Orders list.
2. Update the supplier_order status to "received".
3. Open Variant A details.

## Expected Result

- supplier_order status changes to "received" with receivedAt timestamp.
- Variant A stock_quantity increases from 5 to 9.

## Related Docs

- [[Spec-Order-Management]]
