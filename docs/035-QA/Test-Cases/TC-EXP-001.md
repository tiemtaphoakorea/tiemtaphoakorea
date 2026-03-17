---
id: TC-EXP-001
type: test-case
status: active
feature: Expense Management
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Finance-Accounting]]
---

# TC-EXP-001: List Expenses

## Pre-conditions

- Logged in as Admin.
- At least one expense may exist.

## Test Steps

1. Navigate to Expenses page (`/expenses`).
2. Verify page loads with heading containing "Chi phí" or "Expense".
3. Verify expense list or empty state is visible.

## Expected Result

- Expenses page displays correctly.
- User sees expense list or appropriate empty state.
