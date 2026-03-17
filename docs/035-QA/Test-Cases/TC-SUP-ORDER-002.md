---
id: TC-SUP-ORDER-002
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-002: Receive Stock from Supplier Order

## Pre-conditions

- Logged in as Admin.
- At least one supplier order is in "Chờ" / "Pending" status.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Open a pending order (e.g. click row with "Chờ" / "Pending").
3. Click "Nhập kho" or "Receive".
4. Confirm (e.g. "Xác nhận").

## Expected Result

- Order status updates to received/completed.
- "Đã nhập" or "Completed" (or equivalent) is shown.
