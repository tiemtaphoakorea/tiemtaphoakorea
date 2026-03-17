---
id: TC-SUP-ORDER-005
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-005: Block Status Change from Final States

## Pre-conditions

- Logged in as Admin.
- At least one supplier order in "Đã nhận hàng" / "Received" status.
- At least one supplier order in "Đã hủy" / "Cancelled" status.

## Test Steps

1. Try to update status of a "Received" order to any other status via API.
2. Try to update status of a "Cancelled" order to any other status via API.

## Expected Result

- API returns 500 error for both attempts.
- Error message indicates status cannot be changed from final state.
- Order status remains unchanged.
