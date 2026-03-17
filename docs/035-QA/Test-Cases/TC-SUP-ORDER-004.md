---
id: TC-SUP-ORDER-004
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-004: Transition Status to Cancelled

## Pre-conditions

- Logged in as Admin.
- At least one supplier order is in "Chờ xử lý" / "Pending" status.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Find a pending order row.
3. Click the actions menu button (three dots).
4. Select "Cập nhật trạng thái".
5. Choose "Đã hủy" / "Cancelled" status.
6. Click "Lưu thay đổi" to save.

## Expected Result

- Order status updates to "Đã hủy" / "Cancelled".
- Success toast message "Đã cập nhật trạng thái đơn hàng" is displayed.
- UI reflects the new status.
- Order cannot be changed to other statuses (final state).
