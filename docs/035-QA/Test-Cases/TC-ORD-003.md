---
id: TC-ORD-003
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-003: Create Order with Mixed Stock Types

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A: stock_type = in_stock, stock_quantity = 10.
- Variant B: stock_type = pre_order.

## Test Steps

1. Create an order with Variant A qty 2 and Variant B qty 1.
2. Save the order.

## Expected Result

- Order is created with status "pending".
- Stock for Variant A decreases by 2.
- A supplier_order is created for Variant B with status "pending".
