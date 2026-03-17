---
id: TC-SUP-ORDER-018
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-018: Loading States Display

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Open "Tạo đơn nhập" sheet.
3. Click on "Chọn biến thể sản phẩm" dropdown.

## Expected Result

- Table skeleton or loading indicator appears during data fetch.
- Sheet opens with loading state for products.
- Product list populates after loading completes.
- Empty state shown if no products available.
