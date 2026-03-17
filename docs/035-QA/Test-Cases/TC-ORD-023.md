---
id: TC-ORD-023
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-31
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-023: Reject Cancel After Shipping / Paid

## Pre-conditions

- Logged in as Admin.
- Order exists with status `shipping`, `delivered`, hoặc `paid` (dùng `ORDER_STATUS` từ `lib/constants`).

## Test Steps

1. Đơn **paid**: Kiểm tra UI không hiển thị nút "Hủy đơn".
2. Đơn **shipping** hoặc **delivered**: Attempt to cancel via API (nếu có validate).
3. Đơn **delivered**: UI không có nút chuyển trạng thái (terminal).

## Expected Result

- Đơn đã thanh toán (`paid`): không có nút hủy, không có nút thanh toán tiếp.
- System blocks cancellation khi không hợp lệ (shipping/delivered nếu backend validate).
- Order status remains unchanged khi thao tác không hợp lệ.

## Related Docs

- [[Spec-Order-Management]]
