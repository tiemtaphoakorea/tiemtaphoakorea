---
id: TC-INT-013
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-013: Concurrent Supplier Order Status Update

## Pre-conditions

- Logged in as Admin.
- Supplier order exists with status pending.
- Two separate sessions (A and B).

## Test Steps

1. Session A updates status to "ordered".
2. Session B updates status to "received" at the same time.

## Expected Result

- Final status is consistent and follows allowed transitions.
- Timestamps reflect the final status correctly.
- No duplicate stock adjustments occur.

## Related Docs

- [[Spec-Order-Management]]
