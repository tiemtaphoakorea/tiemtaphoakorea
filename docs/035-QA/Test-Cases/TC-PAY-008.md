---
id: TC-PAY-008
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-008: Payment Negative Amount Rejected

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.

## Test Steps

1. Attempt to record a payment with amount = -1000.

## Expected Result

- System rejects negative payment amount with validation error.

## Related Docs

- [[Spec-Order-Management]]
