---
id: TC-PROD-004
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-004: Create Product - Duplicate SKU

## Pre-conditions

- Logged in as Admin or Manager.
- Existing variant SKU "ABC-30" already stored in the system.

## Test Steps

1. Create a new product.
2. Add a variant with SKU "ABC-30".
3. Click "Save".

## Expected Result

- System blocks creation and shows error "SKU \"ABC-30\" đã tồn tại".
- No product or variants are created.
