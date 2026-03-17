---
id: TC-SUP-ORDER-019
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-019: Manual Restocking Orders (Đơn nhập tạo độc lập)

## Pre-conditions

- Logged in as Admin.
- Product with in_stock variant exists.

## Test Steps

1. Record initial stock quantity.
2. Create supplier order directly (not from an order) via API or UI.
3. Verify supplier order is standalone (đơn nhập và đơn bán không kết nối).
4. Receive the order.
5. Check stock quantity via API.

## Expected Result

- Supplier order is created independently (manual restocking; không liên kết order_item).
- Stock quantity increases when received (manual orders always update stock).
- Order status is "received".
