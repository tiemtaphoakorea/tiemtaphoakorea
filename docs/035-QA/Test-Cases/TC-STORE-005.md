---
id: TC-STORE-005
type: test-case
status: missing
feature: Customer Catalog
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Customer-Catalog]]
---

# TC-STORE-005: Inactive Product Hidden from Storefront

## Pre-conditions

- `TEST_PRODUCTS.inactive` exists in the E2E seed data.
- Storefront is accessible.

## Test Steps

1. As admin, verify `TEST_PRODUCTS.inactive` is set to `active: false` via the API.
2. Navigate to the storefront product listing page (guest context).
3. Search for the inactive product by name or SKU.
4. Browse all listing pages if needed.
5. Navigate directly to the product detail URL (e.g., `/products/inactive-product-slug`).

## Expected Result

- Inactive product does NOT appear in the product listing.
- Inactive product does NOT appear in search results.
- Direct URL to the inactive product detail page returns 404 or a "not found" message.

## Spec File

`tests/e2e/store/inactive-product.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- `TEST_PRODUCTS.inactive` is explicitly defined in `tests/e2e/fixtures/data.ts` but no guest/store test verifies it is hidden.
- Deactivating a product (TC-PROD-012) is itself untested due to a broken import.

## Coverage Gaps

- Inactive product visibility on storefront
- Direct URL access to inactive product
- Inactive variant within an otherwise active product
