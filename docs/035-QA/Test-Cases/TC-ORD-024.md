---
id: TC-ORD-024
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-31
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-024: Order Payment Status Derived from Paid Amount

## Pre-conditions

- Logged in as Staff or Admin.
- Order total = 1,000,000, status = `ORDER_STATUS.PENDING`.

## Test Steps

1. paid_amount = 0 → status giữ `pending`.
2. Ghi nhận thanh toán từng phần (vd 500,000) → paid_amount cập nhật, status vẫn `pending`.
3. Ghi nhận thanh toán đủ (1,000,000) → paid_amount = total, status tự động chuyển `ORDER_STATUS.PAID`, set paid_at.

## Expected Result

- paid_amount < total → status vẫn `pending`.
- paid_amount >= total (một lần hoặc tổng các lần) → status chuyển `paid` (constant từ lib/constants).
- Sau khi paid: UI ẩn nút "Thanh toán", không hiện nút "Hủy đơn".

## Related Docs

- [[Spec-Order-Management]]
