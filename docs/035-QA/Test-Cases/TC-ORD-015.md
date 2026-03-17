---
id: TC-ORD-015
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-015: Delete Supplier Order Restrictions

## Pre-conditions

- Logged in as Admin.
- Supplier Order SO-A has status = pending.
- Supplier Order SO-B has status = ordered.
- Supplier Order SO-C has status = cancelled.

## Test Steps

1. Attempt to delete SO-A (pending).
2. Attempt to delete SO-B (ordered).
3. Attempt to delete SO-C (cancelled).

## Expected Result

- SO-A is deleted successfully.
- SO-B deletion is blocked with error stating only pending/cancelled can be deleted.
- SO-C is deleted successfully.

## Related Docs

- [[Spec-Order-Management]]
