---
id: TC-PROD-021
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-021: Concurrent Stock Updates from Two Admin Sessions

## Pre-conditions

- Logged in as Admin.
- Variant A stock_type = in_stock, stock_quantity = 10.
- Two admin sessions A and B open on the same product.

## Test Steps

1. Admin A updates stock_quantity to 8 and saves.
2. Admin B updates stock_quantity to 12 and saves shortly after.
3. Refresh product detail.

## Expected Result

- Final stock reflects one consistent update (last-write-wins or conflict rejection).
- System prevents silent lost updates if conflict detection is implemented.
- Stock does not become negative.

## Related Docs

- [[Spec-Product-Management]]
