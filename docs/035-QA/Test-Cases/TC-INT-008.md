---
id: TC-INT-008
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-008: Cancel Paid Order Updates Accounting Totals

## Pre-conditions

- Logged in as Admin or Owner.
- Paid order exists in reporting date range.
- Profit report totals captured before cancellation.

## Test Steps

1. Cancel the paid order.
2. Re-run profit report for the same date range.

## Expected Result

- Cancelled order is excluded from revenue/profit totals.
- Report totals decrease accordingly.

## Related Docs

- [[Spec-Order-Management]]
- [[Spec-Finance-Accounting]]
