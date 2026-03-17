---
id: TC-ACC-013
type: test-case
status: draft
feature: Accounting
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-013: Expense Amount Validation

## Pre-conditions

- Logged in as Admin or Owner.
- On Expenses page.

## Test Steps

1. Create expense with amount = 0.
2. Create expense with amount = -1000.
3. Create expense with a valid positive amount.

## Expected Result

- Amount 0 and negative amounts are rejected with validation errors.
- Positive amount is accepted and saved.

## Related Docs

- [[Spec-Finance-Accounting]]
