---
id: TC-SUP-ORDER-021
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-021: Reject Invalid variantId

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. POST to /api/admin/supplier-orders with non-existent variantId.
2. Use UUID format but non-existing ID: "00000000-0000-0000-0000-000000000000".

## Expected Result

- API returns 400 or 500 error.
- Order is not created.
- Error message indicates invalid variantId.
