---
id: TC-PAY-005
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-005: Overpayment Not Allowed

## Pre-conditions

- Logged in as Staff or Admin.
- Order total = 1,000,000 and paid_amount = 0.

## Test Steps

1. Record payment amount = 1,200,000.

## Expected Result

- System rejects overpayment with validation error.
- paid_amount remains unchanged.

## Related Docs

- [[Spec-Order-Management]]
