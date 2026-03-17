---
id: TC-CATALOG-002
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-002: Product Detail Variant Selection

## Pre-conditions

- Product "Basic Tee" has at least 2 variants with distinct prices and images.
- Public storefront is accessible (no login).

## Test Steps

1. Open product detail page for "Basic Tee".
2. Select Variant A.
3. Select Variant B.

## Expected Result

- Variant A shows correct price and image set.
- Variant B shows its own price and image set.
- Selected variant is reflected in the UI (name/option).

## Related Docs

- [[Spec-Customer-Catalog]]
