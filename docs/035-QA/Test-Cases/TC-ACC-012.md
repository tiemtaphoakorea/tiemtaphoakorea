---
id: TC-ACC-012
type: test-case
status: draft
feature: Accounting
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-012: Profit Report Date Range Boundaries

## Pre-conditions

- Logged in as Admin or Owner.
- Orders exist at the start and end timestamps of a day.

## Test Steps

1. Run profit report for a single day (00:00 to 23:59).
2. Verify orders at boundaries are included.

## Expected Result

- Orders at the day boundaries are included.
- Totals match expected revenue and profit.

## Related Docs

- [[Spec-Finance-Accounting]]
