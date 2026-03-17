---
id: TC-STORE-001
type: test-case
status: active
feature: Storefront
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Customer-Catalog]]
---

# TC-STORE-001: Display Featured Products on Homepage

## Pre-conditions

- Storefront is accessible (no login).
- At least one active product exists.

## Test Steps

1. Open storefront homepage (`/`).
2. Verify page title contains "Store" or "Shop".
3. Verify "Featured" or "Sản phẩm nổi bật" section is visible.
4. Verify at least one product card is visible.

## Expected Result

- Homepage loads with correct title.
- Featured products section and at least one product card are displayed.
