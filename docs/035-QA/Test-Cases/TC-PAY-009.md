---
id: TC-PAY-009
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-009: Zero Payment Amount Rejected

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.

## Test Steps

1. Attempt to record a payment with amount = 0.

## Expected Result

- System rejects zero payment amount with validation error.

## Related Docs

- [[Spec-Order-Management]]
