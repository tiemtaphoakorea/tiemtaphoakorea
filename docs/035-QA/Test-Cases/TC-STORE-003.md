---
id: TC-STORE-003
type: test-case
status: active
feature: Storefront
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Customer-Catalog]]
---

# TC-STORE-003: Filter Products on Listing Page

## Pre-conditions

- Storefront catalog page `/products` is accessible (no login).
- At least one product named "Basic Tee" exists in seed data.

## Test Steps

1. Open storefront catalog page (`/products`).
2. Verify the product list is visible.
3. In the search input ("Tìm kiếm trong danh mục..."), type `"Basic Tee"`.
4. Verify the URL contains query parameter `q=Basic+Tee`.
5. Verify at least one product in the list shows name "Basic Tee".

## Expected Result

- Search filter updates the listing based on the query.
- Products matching the search term are visible in the list.
