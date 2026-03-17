---
id: TC-ACC-001
type: test-case
status: active
feature: Accounting
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-001: Expense Entry & P&L Calculation

## Pre-conditions

- Logged in as Owner.
- At least one delivered order exists with revenue.

## Test Steps

1. Navigate to "Accounting" > "Expenses".
2. Click "Add Expense".
3. Enter Category: "Rent", Amount: 5,000,000.
4. Save expense.
5. Navigate to "Reports" > "P&L".
6. Verify Revenue = Sum of delivered orders.
7. Verify Expenses = Sum of recorded expenses.
8. Verify Profit = Revenue - Expenses.

## Expected Result

- Expense recorded correctly.
- P&L report shows accurate calculations.
- New expense reflects in totals immediately.
