---
id: TC-SUP-ORDER-016
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-016: Block Unauthorized Access to API

## Pre-conditions

- User is not authenticated (logged out).

## Test Steps

1. Logout from the application.
2. Try to GET /api/admin/supplier-orders.
3. Try to POST /api/admin/supplier-orders.
4. Log back in as admin.

## Expected Result

- GET request returns 401 Unauthorized.
- POST request returns 401 Unauthorized.
- Authenticated requests work normally after login.
