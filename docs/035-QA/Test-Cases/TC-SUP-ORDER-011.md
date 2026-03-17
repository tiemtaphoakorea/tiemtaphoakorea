---
id: TC-SUP-ORDER-011
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-011: Supplier Selection When Creating Order

## Pre-conditions

- Logged in as Admin.
- At least one product with variants exists.
- Supplier selection UI is available (optional field).

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Click "Tạo đơn nhập" button.
3. Select a product variant.
4. Check if supplier dropdown is available.
5. Create order without selecting a supplier (optional field).

## Expected Result

- Supplier selection dropdown appears (if feature enabled).
- Order can be created without supplier (field is optional).
- Order is created successfully with status "pending".
