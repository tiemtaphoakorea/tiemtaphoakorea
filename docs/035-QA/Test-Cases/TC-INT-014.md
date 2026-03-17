---
id: TC-INT-014
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-014: Order Creation Transaction Rollback

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A stock_type = in_stock, stock_quantity = 5.
- Simulate failure during order creation (e.g. order_items insert or stock update).

## Test Steps

1. Create an order containing both in_stock and pre_order items.
2. Force a failure mid-transaction (e.g. second insert or stock update).

## Expected Result

- Order is not created (transaction rolls back).
- Stock for in_stock items is not reduced.
- No partial data remains (no order, no order_items). Supplier_orders are not created by order creation (they are independent).

## Related Docs

- [[Spec-Order-Management]]
