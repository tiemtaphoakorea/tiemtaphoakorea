---
id: TC-SUP-ORDER-003
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-003: Transition Status to Ordered

## Pre-conditions

- Logged in as Admin.
- At least one supplier order is in "Chờ xử lý" / "Pending" status.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Find a pending order row.
3. Click the actions menu button (three dots).
4. Select "Cập nhật trạng thái".
5. Choose "Đã đặt hàng" / "Ordered" status.
6. Click "Lưu thay đổi" to save.

## Expected Result

- Order status updates to "Đã đặt hàng" / "Ordered".
- `orderedAt` timestamp is set.
- Success toast message "Đã cập nhật trạng thái đơn hàng" is displayed.
- UI reflects the new status.
