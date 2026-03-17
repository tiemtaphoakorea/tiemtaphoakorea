---
id: TC-PROD-010
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-010: Inventory Stock Type Behavior

## Pre-conditions

- Logged in as Admin or Manager.
- On "New Product" form.

## Test Steps

1. Create Variant A with stock_type = in_stock and stock_quantity = 10.
2. Create Variant B with stock_type = pre_order and stock_quantity = 10.
3. Save product.

## Expected Result

- Variant A stores stock_quantity = 10.
- Variant B stores stock_quantity = 0 and displays as pre-order in admin list.
- Stock type badges appear correctly in list view.
