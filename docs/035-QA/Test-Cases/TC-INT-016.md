---
id: TC-INT-016
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-016: Idempotent Create Order by Client Token

## Pre-conditions

- Logged in as Staff or Admin.
- Order create API supports idempotency key or client token.

## Test Steps

1. Send Create Order request with idempotency key K1.
2. Retry the same request with key K1 (same payload).

## Expected Result

- Only one order is created.
- Second request returns the original order result.

## Related Docs

- [[Spec-Order-Management]]
