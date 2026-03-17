---
id: TC-SUP-ORDER-013
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-013: Empty State When No Orders Exist

## Pre-conditions

- Logged in as Admin.
- No supplier orders exist (or search returns no results).

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Search for a term that doesn't exist.

## Expected Result

- Empty state is displayed.
- Message "Không có đơn đặt hàng nào" is shown.
- Message "Các đơn hàng Pre-order sẽ xuất hiện tại đây" is shown.
- Truck icon is displayed in the empty state.
