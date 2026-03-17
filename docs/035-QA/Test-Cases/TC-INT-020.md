---
id: TC-INT-020
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-020: Idempotent Cancel Order Request

## Pre-conditions

- Logged in as Admin.
- Order exists with status pending or paid.

## Test Steps

1. Send cancel order request.
2. Retry the same cancel request.

## Expected Result

- Order is cancelled once.
- Second request returns the current cancelled status without errors.
- Stock restoration occurs only once.

## Related Docs

- [[Spec-Order-Management]]
