---
id: TC-STORE-004
type: test-case
status: active
feature: Storefront
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Customer-Catalog]]
---

# TC-STORE-004: Navbar Menu & Category Links

## Pre-conditions

- Storefront homepage (`/`) is accessible (no login).

## Test Steps

1. Open storefront homepage (`/`).
2. Verify the top navbar is visible with K-SMART logo linking to home.
3. Verify `DANH MỤC` link is visible in the navbar.
4. Verify category links are visible in the navbar (at minimum: `Chăm sóc da`, `Đồ gia dụng`, `Hàng mới`).
5. Click on `Chăm sóc da` category link.
6. Verify browser navigates to `/products` with `category` query parameter.
7. Verify catalog page heading `Danh mục Sản phẩm` is visible.

## Expected Result

- Navbar menu and category links are rendered correctly on the storefront homepage.
- Clicking a category link navigates to the catalog page with the category filter applied.
