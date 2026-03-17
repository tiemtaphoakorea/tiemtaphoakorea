---
id: TC-SUP-ORDER-007
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-007: Filter Orders by Status

## Pre-conditions

- Logged in as Admin.
- Supplier orders exist with various statuses (pending, ordered, received, cancelled).

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Click the status filter dropdown (default shows "Tất cả trạng thái").
3. Select "Chờ xử lý" / "Pending".
4. Clear filter and select "Đã nhận hàng" / "Received".
5. Try other status filters.

## Expected Result

- List shows only orders matching the selected status.
- Filter button displays the current filter label.
- "Tất cả trạng thái" shows all orders.
