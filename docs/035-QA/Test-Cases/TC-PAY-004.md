---
id: TC-PAY-004
type: test-case
status: draft
feature: Payment
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-PAY-004: Payment Audit Trail

## Pre-conditions

- Logged in as Staff or Manager.
- Order exists with total > 0.

## Test Steps

1. Add two payments with different methods.
2. Open payment history for the order.

## Expected Result

- Payment history shows each record with amount, method, and timestamp.
- Order paid_amount equals sum of all payment records.
