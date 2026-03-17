---
id: TC-CATALOG-001
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-001: Catalog List + Search & Filter

## Pre-conditions

- Public storefront is accessible (no login).
- At least 3 products across 2 categories and 2 price ranges.

## Test Steps

1. Open the customer catalog page.
2. Search by product name keyword.
3. Apply category filter A.
4. Apply a price range filter.
5. Clear all filters.

## Expected Result

- Catalog loads without authentication.
- Search returns only matching products.
- Category and price filters narrow the list correctly.
- Clearing filters restores full catalog.

## Related Docs

- [[Spec-Customer-Catalog]]
