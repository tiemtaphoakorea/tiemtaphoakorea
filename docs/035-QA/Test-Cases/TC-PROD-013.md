---
id: TC-PROD-013
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-013: Customer Catalog View

## Pre-conditions

- Catalog has active products with multiple variants and images.
- At least one product has only pre_order variants.

## Test Steps

1. Open catalog page.
2. Verify each product card shows name, image, and price range.
3. Search for a known product name.
4. Filter by a category.

## Expected Result

- Only active products are shown.
- Price range displays min-max of active variants.
- Stock status shows in_stock, out_of_stock, or pre_order based on variants.
- Search and category filters return correct results.
