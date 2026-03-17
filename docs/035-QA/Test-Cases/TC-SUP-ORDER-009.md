---
id: TC-SUP-ORDER-009
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-009: Persist Update Fields (Note, Actual Cost Price, Expected Date)

## Pre-conditions

- Logged in as Admin.
- At least one supplier order exists.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Find an order row.
3. Click the actions menu and select "Cập nhật trạng thái".
4. Fill in:
   - Status: "Đã đặt hàng"
   - Giá vốn thực tế: e.g., "55000"
   - Ngày dự kiến về: e.g., tomorrow's date
   - Ghi chú: custom note text
5. Click "Lưu thay đổi".
6. Verify via API that all fields are persisted.

## Expected Result

- All fields are saved correctly.
- `actualCostPrice` is stored as number.
- `expectedDate` is stored as date.
- `note` contains the entered text.
- Status is updated.
