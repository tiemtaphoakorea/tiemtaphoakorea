---
id: TC-INT-019
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-019: Idempotent Add Payment with Different Payload

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.
- Payment API supports idempotency key or client token.

## Test Steps

1. Send Add Payment request with idempotency key P2 (amount = 300,000).
2. Send Add Payment request again with key P2 but amount = 400,000.

## Expected Result

- Second request is rejected or returns original payment.
- No duplicate payment is recorded.

## Related Docs

- [[Spec-Order-Management]]
