---
id: TC-SUP-ORDER-017
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-017: API Input Validation Errors

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. POST to /api/admin/supplier-orders without variantId (only quantity).
2. POST to /api/admin/supplier-orders without quantity (only variantId).
3. PATCH to /api/admin/supplier-orders/:id with invalid status value.

## Expected Result

- Missing variantId returns 400 Bad Request.
- Missing quantity returns 400 Bad Request.
- Invalid status returns 500 or 400 error.
