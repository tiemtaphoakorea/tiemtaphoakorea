---
id: TC-INT-003
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-003: Multi-Product Order with Out-of-Stock Item

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A: stock_type = in_stock, stock_quantity = 2.
- Variant B: stock_type = in_stock, stock_quantity = 0.

## Test Steps

1. Create a new order with Variant A quantity = 1 and Variant B quantity = 1.
2. Click "Create Order".

## Expected Result

- **Đơn vẫn được tạo** (theo spec: Thiếu hàng → Mark Pre-order, Create Supplier Order).
- API trả về `order` và `itemsNeedingStock` (danh sách món cần nhập thêm hàng).
- UI hiển thị thông báo cần nhập thêm hàng cho các món trong `itemsNeedingStock`.
- Variant A (có sẵn 2): trừ 1 từ tồn kho, còn 1.
- Variant B (hết hàng): trừ full 1 (tồn kho cho phép âm → B = -1); tạo supplier_order với quantity = 1; có thể tracking trạng thái từng món (pending → ordered → received) tại Đơn nhập hàng.
- Tồn kho A = 1, B = -1 sau khi tạo đơn.

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Order-Management]]
