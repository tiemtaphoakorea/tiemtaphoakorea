---
id: TC-INT-015
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-INT-015: Manual Stock Increase Reflects in Catalog Availability

## Pre-conditions

- Logged in as Admin or Manager.
- Variant A stock_type = in_stock, stock_quantity = 0.
- Customer catalog open in separate session.

## Test Steps

1. In admin, update Variant A stock_quantity to 5.
2. Refresh the catalog product detail page.

## Expected Result

- Catalog stock status changes from "Tạm hết hàng" to "Sẵn sàng giao".
- Stock indicator reflects updated quantity.

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Customer-Catalog]]
