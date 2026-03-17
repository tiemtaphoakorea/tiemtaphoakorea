---
id: TC-PROD-008
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-008: Add & Remove Variant

## Pre-conditions

- Logged in as Admin or Manager.
- Existing product with at least one variant.

## Test Steps

1. Open product edit form.
2. Add a new variant with unique SKU.
3. Save and confirm the new variant appears in list.
4. Remove an existing variant and save.

## Expected Result

- New variant is created and visible in product detail and list.
- Removed variant is soft-deleted (no longer visible in UI or catalog).
- SKU uniqueness is enforced system-wide.
