---
id: TC-PROD-018
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-018: Low Stock Threshold Update Affects Filter

## Pre-conditions

- Logged in as Admin or Manager.
- Variant A stock_quantity = 5, low_stock_threshold = 2.

## Test Steps

1. Set low_stock_threshold for Variant A to 6.
2. Open product list and apply "Low Stock" filter.

## Expected Result

- Variant A appears in low stock list after threshold update.
- Threshold change persists after reload.

## Related Docs

- [[Spec-Product-Management]]
