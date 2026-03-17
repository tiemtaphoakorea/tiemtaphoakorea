---
id: TC-INT-018
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-018: Idempotent Add Payment by Client Token

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.
- Payment API supports idempotency key or client token.

## Test Steps

1. Send Add Payment request with idempotency key P1.
2. Retry the same request with key P1.

## Expected Result

- Only one payment is recorded.
- Second request returns the original payment result.
- paid_amount increases only once.

## Related Docs

- [[Spec-Order-Management]]
