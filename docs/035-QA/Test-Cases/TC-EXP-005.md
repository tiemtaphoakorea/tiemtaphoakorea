---
id: TC-EXP-005
type: test-case
status: missing
feature: Accounting
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Finance-Accounting]]
---

# TC-EXP-005: Expense Delete Flow

## Pre-conditions

- Admin logged in.
- At least one expense exists.

## Test Steps

1. Navigate to the expenses list.
2. Click "Delete" on an existing expense.
3. Confirm deletion in the dialog.
4. Verify the expense is removed from the list.
5. Verify the finance summary no longer includes that expense amount.

## Expected Result

- Expense is removed from the list.
- Finance P&L totals update to exclude the deleted expense.

## Spec File

`tests/e2e/expenses/delete.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- Expense delete flow is **completely absent** from all E2E tests.

## Coverage Gaps

- Delete expense
- Verify finance totals recalculate after delete
