---
id: TC-INT-017
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-017: Idempotent Create Order with Different Payload

## Pre-conditions

- Logged in as Staff or Admin.
- Order create API supports idempotency key or client token.

## Test Steps

1. Send Create Order request with idempotency key K2 (payload A).
2. Send Create Order request again with key K2 but payload B.

## Expected Result

- System rejects the second request or returns original result.
- No second order is created with the same key.

## Related Docs

- [[Spec-Order-Management]]
