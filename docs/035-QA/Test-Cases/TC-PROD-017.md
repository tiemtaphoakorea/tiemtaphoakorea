---
id: TC-PROD-017
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-017: Category Filter Uses Active Products Only

## Pre-conditions

- Logged in as Admin or Manager.
- Category A has two products: one active, one inactive.

## Test Steps

1. Open product list and filter by Category A.
2. Open customer catalog and filter by Category A.

## Expected Result

- Admin list shows both products with status indicators.
- Customer catalog shows only active products.

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Customer-Catalog]]
