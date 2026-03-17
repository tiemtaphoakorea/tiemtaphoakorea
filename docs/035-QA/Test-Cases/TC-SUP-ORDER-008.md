---
id: TC-SUP-ORDER-008
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-008: Update Stock When Receiving In-Stock Items

## Pre-conditions

- Logged in as Admin.
- Product with in_stock variant exists.
- Initial stock quantity is known.

## Test Steps

1. Record initial stock quantity of in_stock variant.
2. Create supplier order for that variant with quantity X.
3. Navigate to supplier orders list.
4. Find and receive the order via UI (update status to "Đã nhận hàng").
5. Check stock quantity via API.

## Expected Result

- Stock quantity increases by X.
- Order status is "received".
- `receivedAt` timestamp is set.
