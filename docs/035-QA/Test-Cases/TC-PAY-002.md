---
id: TC-PAY-002
type: test-case
status: draft
feature: Payment
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-PAY-002: Payment Method Validation

## Pre-conditions

- Logged in as Staff or Manager.
- Order exists with total > 0.

## Test Steps

1. Add payment with method "Cash".
2. Add payment with method "Transfer".
3. Attempt to add payment with unsupported method.

## Expected Result

- Cash and Transfer are accepted.
- Unsupported method is rejected with validation error.
