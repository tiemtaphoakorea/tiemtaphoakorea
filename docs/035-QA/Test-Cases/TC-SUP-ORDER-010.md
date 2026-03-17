---
id: TC-SUP-ORDER-010
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-010: Search Orders by SKU and Product Name

## Pre-conditions

- Logged in as Admin.
- At least one supplier order exists with a known SKU.

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Enter a valid SKU in the search box.
3. Wait for results to update.
4. Clear search and enter a product name.
5. Enter a non-existent search term.

## Expected Result

- Search by SKU returns matching orders.
- Search by product name returns matching orders.
- Non-existent term shows empty state with message "Không có đơn đặt hàng nào".
