---
id: TC-EXP-004
type: test-case
status: missing
feature: Accounting
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Finance-Accounting]]
---

# TC-EXP-004: Expense Edit Flow

## Pre-conditions

- Admin logged in.
- At least one expense exists.

## Test Steps

1. Fetch the existing expense via API or navigate to the expenses list.
2. Click "Edit" on an expense.
3. Change the `amount` to a new value.
4. Change the `description` to a new value.
5. Click "Save".
6. Re-fetch the expense and verify updated values are persisted.

## Expected Result

- Updated `amount` and `description` are reflected immediately.
- Finance summary recalculates to include the updated expense amount.
- No duplicate expense is created.

## Spec File

`tests/e2e/expenses/edit.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- Expense edit flow is **completely absent** from all E2E tests.
- `expense-crud.spec.ts` suggests CRUD coverage but only tests create and validation; edit and delete are missing.

## Coverage Gaps

- Edit amount, description, type, date
- Verify finance totals recalculate after edit
