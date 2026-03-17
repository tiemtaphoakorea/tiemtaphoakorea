---
id: TC-STORE-002
type: test-case
status: active
feature: Storefront
created: 2026-02-01
updated: 2026-02-02
linked-to: [[Spec-Customer-Catalog]]
---

# TC-STORE-002: View Product Details

## Pre-conditions

- Storefront is accessible (no login).
- At least one product with variant exists.

## Test Steps

1. Open storefront homepage (`/`).
2. Click on a product card to open product detail page.
3. Verify product detail page loads with:
   - Product heading (h1)
   - Product price is visible
   - Stock status is displayed
   - "Liên hệ đặt hàng ngay" button is visible
4. If multiple variants exist, verify variant selector is displayed.

## Expected Result

- Product detail page loads correctly with all required information.
- User can view product details without requiring login.
