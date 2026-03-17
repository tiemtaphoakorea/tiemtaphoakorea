---
id: TC-ORD-016
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-016: Supplier Order Update Fields Persist

## Pre-conditions

- Logged in as Admin.
- Supplier order exists with status = pending.

## Test Steps

1. Update supplier order status to "ordered" with expected date and note.
2. Refresh Supplier Orders list.
3. Update status to "received" with actual cost price.
4. Refresh Supplier Orders list.

## Expected Result

- orderedAt timestamp is set when status becomes "ordered".
- expected date and note are saved and visible after refresh.
- receivedAt timestamp is set when status becomes "received".
- actual cost price is saved and visible after refresh.

## Related Docs

- [[Spec-Order-Management]]
