---
id: TC-INT-001
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-001: Create Product then Create Order (Stock Decrease + Low Stock)

## Pre-conditions

- Logged in as Admin or Manager.
- Variant A does not exist.

## Test Steps

1. Create Product "Basic Tee" with Variant A (SKU "BTEE-BLK-S"), stock_type = in_stock, stock_quantity = 5, low_stock_threshold = 2.
2. Create a new order with Variant A quantity = 3.
3. Open Product list and locate Variant A.

## Expected Result

- Order is created successfully.
- Variant A stock_quantity decreases from 5 to 2.
- Variant A is flagged as low stock in product listing.

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Order-Management]]
