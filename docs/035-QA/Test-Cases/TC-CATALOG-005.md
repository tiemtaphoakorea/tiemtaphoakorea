---
id: TC-CATALOG-005
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-005: Retail Price Display Updates After Admin Change

## Pre-conditions

- Product "Basic Tee" is visible in catalog.
- Logged in as Admin or Manager in a separate session.

## Test Steps

1. In admin, update the retail price for "Basic Tee".
2. Open the catalog product list and detail page.
3. Refresh the catalog page if necessary.

## Expected Result

- Catalog displays the updated retail price.
- Price is consistent between list and detail views.

## Related Docs

- [[Spec-Customer-Catalog]]
- [[Spec-Product-Management]]
