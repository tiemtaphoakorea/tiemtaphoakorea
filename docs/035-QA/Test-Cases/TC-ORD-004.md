---
id: TC-ORD-004
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-31
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-004: Order Status Transition Rules

## Pre-conditions

- Logged in as Admin.
- Existing order with status `pending` (use constant `ORDER_STATUS.PENDING` từ `lib/constants`).

## Test Steps

1. Trên UI: đơn pending chỉ hiện nút "Hủy đơn" và dialog "Thanh toán".
2. Ghi nhận thanh toán đủ → status tự động chuyển `paid`.
3. Trên UI: đơn paid chỉ hiện nút "Đánh dấu đã giao" (không nút Thanh toán, không nút Hủy đơn).
4. Chuyển status sang `delivered` (nút "Đánh dấu đã giao" hoặc API với `ORDER_STATUS.DELIVERED`).
5. API: có thể chuyển pending → preparing (tương thích); preparing/shipping → delivered hoặc cancelled.
6. Attempt invalid transition: delivered → cancelled (API nếu có validate).

## Expected Result

- Valid transitions succeed and are recorded in status history.
- UI dùng `ORDER_STATUS` constant; không hardcode chuỗi trạng thái.
- Invalid transition (delivered → cancelled) bị chặn nếu backend validate.
