---
id: TC-PAY-007
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-007: Payment Method Required

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.

## Test Steps

1. Attempt to record a payment without selecting a payment method.

## Expected Result

- System shows validation error and does not save payment.

## Related Docs

- [[Spec-Order-Management]]
