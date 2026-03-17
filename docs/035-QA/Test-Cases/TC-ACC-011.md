---
id: TC-ACC-011
type: test-case
status: draft
feature: Accounting
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-011: Profit Report Excludes Cancelled Orders

## Pre-conditions

- Logged in as Admin or Owner.
- Two orders exist in the date range: one delivered, one cancelled.

## Test Steps

1. Open profit report for the date range covering both orders.
2. Compare totals against delivered order only.

## Expected Result

- Cancelled order is excluded from revenue, cost, and profit totals.

## Related Docs

- [[Spec-Finance-Accounting]]
