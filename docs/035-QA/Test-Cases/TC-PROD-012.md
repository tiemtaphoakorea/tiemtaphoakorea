---
id: TC-PROD-012
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-012: Deactivate Product & Catalog Visibility

## Pre-conditions

- Logged in as Admin or Manager.
- Existing active product shown in catalog.

## Test Steps

1. Open product detail in admin.
2. Set status to Inactive (or Archive/Hide).
3. Save changes.
4. Open the customer catalog view.

## Expected Result

- Product status updates to inactive in admin.
- Inactive product is hidden from catalog and customer search results.
- Admin list can filter to show inactive products.
