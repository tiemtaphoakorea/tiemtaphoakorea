---
id: TC-SUP-ORDER-001
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-01
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-001: Create Supplier Order

## Pre-conditions

- Logged in as Admin.
- At least one product with variants exists in the system.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Click "Tạo đơn nhập" button.
3. Select a product variant from the combobox.
4. Optionally enter quantity (default is 1).
5. Optionally add a note.
6. Click "Xác nhận tạo đơn" to submit.

## Expected Result

- Order is created with status "Chờ xử lý" / "Pending".
- Success toast message "Thành công" is displayed.
- Order appears in the list.
- User is redirected back to `/supplier-orders`.
