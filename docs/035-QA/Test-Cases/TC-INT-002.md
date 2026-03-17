---
id: TC-INT-002
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-002: Multi-Product Order (In-stock + Pre-order)

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A: stock_type = in_stock, stock_quantity = 10.
- Variant B: stock_type = pre_order.

## Test Steps

1. Create a new order with Variant A quantity = 2 and Variant B quantity = 1.
2. Save the order.
3. Open Supplier Orders page.
4. Open Product details for Variant A and Variant B.

## Expected Result

- Order is created with both items.
- Variant A stock_quantity decreases from 10 to 8.
- Variant B stock_quantity remains unchanged.
- A supplier_order is created for the pre_order item (Variant B).

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Order-Management]]
