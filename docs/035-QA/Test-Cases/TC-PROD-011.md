---
id: TC-PROD-011
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-011: Low Stock Alert & Stock Filters

## Pre-conditions

- Logged in as Admin or Manager.
- Product variants exist with stock_quantity values: 0, 2, 5, 20.
- low_stock_threshold is configured (e.g., 5).

## Test Steps

1. Open Products list.
2. Verify badges for out_of_stock (0), low_stock (<= 5), and in_stock (> 5).
3. Apply stock filters: Out of Stock, Low Stock, In Stock, Pre-order.

## Expected Result

- Low stock variants show warning indicator.
- Filters return the correct product subset based on variant stock status.
