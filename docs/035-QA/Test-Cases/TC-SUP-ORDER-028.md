---
id: TC-SUP-ORDER-028
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-028: Maintain Data Consistency on Rapid Status Changes

## Pre-conditions

- Logged in as Admin.
- Valid product variant exists.

## Test Steps

1. Create order.
2. Rapidly change status: ordered → ordered (duplicate) → received.
3. Verify final state.

## Expected Result

- Final status is "received".
- Both orderedAt and receivedAt are set.
- Data remains consistent despite rapid changes.
