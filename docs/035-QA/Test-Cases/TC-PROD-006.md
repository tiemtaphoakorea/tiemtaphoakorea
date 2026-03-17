---
id: TC-PROD-006
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-006: Update Product Info & Slug

## Pre-conditions

- Logged in as Admin or Manager.
- Existing product with name "Kem dưỡng ABC" and slug "kem-duong-abc".

## Test Steps

1. Open product details.
2. Change name to "Kem dưỡng ABC Plus".
3. Click "Save".

## Expected Result

- Product name updates in the list and detail view.
- Slug is regenerated to match the new name (e.g., "kem-duong-abc-plus").
