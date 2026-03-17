---
id: TC-SUP-ORDER-020
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-020: Error Toast on Failed Operations

## Pre-conditions

- Logged in as Admin.
- At least one supplier order exists.

## Test Steps

1. Create a supplier order.
2. Change status to "ordered".
3. Attempt to delete the ordered order.

## Expected Result

- Error toast is displayed with message "Lỗi" or "Cannot delete".
- Order is not deleted.
- API returns 500 error for delete attempt.
