---
id: TC-SUP-ORDER-012
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-012: Set Expected Date When Creating Order

## Pre-conditions

- Logged in as Admin.
- At least one product with variants exists.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Click "Tạo đơn nhập" button.
3. Select a product variant.
4. Set "Ngày dự kiến về" (Expected Date) to a future date.
5. Add a note and submit.

## Expected Result

- Order is created successfully.
- Expected date is stored with the order.
- Date appears in the order list ("Ngày về (Dự kiến)" column).
