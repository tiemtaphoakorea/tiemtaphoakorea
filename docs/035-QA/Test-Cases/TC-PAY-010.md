---
id: TC-PAY-010
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-010: Duplicate Payment Submission Prevented

## Pre-conditions

- Logged in as Staff or Admin.
- Order exists with total > 0.

## Test Steps

1. Open Add Payment form.
2. Double-click "Save" quickly or submit twice.

## Expected Result

- Only one payment record is created.
- paid_amount increments once.

## Related Docs

- [[Spec-Order-Management]]
