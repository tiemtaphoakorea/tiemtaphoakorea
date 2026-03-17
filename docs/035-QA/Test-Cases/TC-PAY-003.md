---
id: TC-PAY-003
type: test-case
status: draft
feature: Payment
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-PAY-003: Payment Amount Validation

## Pre-conditions

- Logged in as Staff or Manager.
- Order exists with total > 0.

## Test Steps

1. Add payment with amount = 0.
2. Add payment with amount = -10,000.

## Expected Result

- System blocks invalid amounts and shows validation error.
- No payment record is created.
