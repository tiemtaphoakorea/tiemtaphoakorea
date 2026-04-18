---
id: TC-CATALOG-007
type: test-case
status: missing
feature: Customer Catalog
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-007: Product Sort Order on Listing Page

## Pre-conditions

- Multiple products seeded with different prices.
- Storefront listing page accessible.

## Test Steps

1. Navigate to the storefront product listing.
2. Select sort option "Price: Low to High" (`price-asc`).
3. Capture the price of the first product shown.
4. Select sort option "Price: High to Low" (`price-desc`).
5. Capture the price of the first product shown.
6. Verify price order is reversed.
7. Select "Latest" (`latest`) sort.
8. Verify most recently added product appears first.

## Expected Result

- `price-asc`: Products ordered cheapest first.
- `price-desc`: Products ordered most expensive first.
- `latest`: Products ordered by creation date descending.

## Spec File

`tests/e2e/guest/sort.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- `PRODUCT_SORT` constants (`latest`, `price-asc`, `price-desc`) are defined in `packages/shared/src/constants.ts` but **never exercised in any test**.

## Coverage Gaps

- All three sort orders
- Sort persists across pagination
- Sort parameter reflected in URL
