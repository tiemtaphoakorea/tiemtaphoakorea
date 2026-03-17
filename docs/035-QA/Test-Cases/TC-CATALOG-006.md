---
id: TC-CATALOG-006
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-006: Catalog Pagination and Empty State

## Pre-conditions

- Public storefront is accessible.
- Catalog has more than one page of products.

## Test Steps

1. Open catalog page 1 and verify product count.
2. Navigate to page 2.
3. Apply a search that yields zero results.

## Expected Result

- Pagination navigates between pages correctly.
- Search with no matches shows an empty state message.

## Related Docs

- [[Spec-Customer-Catalog]]
