---
id: TC-PROD-016
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-016: Variant Stock Quantity Validation

## Pre-conditions

- Logged in as Admin or Manager.
- On Product create or edit form.

## Test Steps

1. Enter stock_quantity = -1 for an in_stock variant.
2. Enter stock_quantity = 2.5 (non-integer).
3. Save the product.

## Expected Result

- Validation errors are shown for invalid stock_quantity values.
- Product is not saved with invalid stock.

## Related Docs

- [[Spec-Product-Management]]
