---
id: TC-CATALOG-004
type: test-case
status: draft
feature: Customer Catalog
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-Catalog]]
---

# TC-CATALOG-004: Public Access to Catalog and Detail

## Pre-conditions

- Public storefront is accessible.
- At least one active product exists.

## Test Steps

1. Open catalog page in an incognito session.
2. Open a product detail page directly via URL.

## Expected Result

- Catalog and product detail pages are accessible without login.
- No admin-only data is exposed.

## Related Docs

- [[Spec-Customer-Catalog]]
