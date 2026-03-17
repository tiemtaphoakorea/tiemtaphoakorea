---
id: TC-PROD-022
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-022: Prevent Negative Stock on Manual Update

## Pre-conditions

- Logged in as Admin or Manager.
- Variant A stock_type = in_stock, stock_quantity = 1.

## Test Steps

1. Attempt to update stock_quantity to -5.
2. Save.

## Expected Result

- System rejects negative stock update.
- Stock remains unchanged.

## Related Docs

- [[Spec-Product-Management]]
