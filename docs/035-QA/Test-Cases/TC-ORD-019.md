---
id: TC-ORD-019
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-019: Order Status History Logged

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with status pending.

## Test Steps

1. Change order status pending → paid.
2. Change order status paid → preparing.
3. Open order status history.

## Expected Result

- Status history records each transition with timestamp and updatedBy.
- Latest status is shown as preparing.

## Related Docs

- [[Spec-Order-Management]]
