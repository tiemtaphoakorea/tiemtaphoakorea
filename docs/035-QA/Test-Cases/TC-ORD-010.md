---
id: TC-ORD-010
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-010: Create Order - Insufficient Stock (vẫn tạo đơn, cần nhập thêm hàng)

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A stock_type = in_stock, stock_quantity = 5.

## Test Steps

1. Create an order with Variant A quantity = 10.
2. Click "Create Order".

## Expected Result

- **Đơn vẫn được tạo** (theo spec: Thiếu hàng → Mark Pre-order, Create Supplier Order).
- API trả về `order` và `itemsNeedingStock` (món cần nhập thêm: 5 đơn vị).
- UI hiển thị thông báo cần nhập thêm hàng (có thể tracking trạng thái từng món tại Đơn nhập hàng).
- Tồn kho cho phép âm: A trừ full 10 (còn 5 - 10 = -5); supplier_order tạo cho 5 đơn vị.
