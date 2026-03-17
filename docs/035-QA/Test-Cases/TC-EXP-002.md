---
id: TC-EXP-002
type: test-case
status: active
feature: Expense Management
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Finance-Accounting]]
---

# TC-EXP-002: Create New Expense

## Pre-conditions

- Logged in as Admin.
- On Expenses page (`/expenses`).

## Test Steps

1. Click "Thêm chi phí" (Add Expense).
2. Enter description (e.g. unique text).
3. Enter amount (e.g. 500000).
4. Select category/type if the field exists.
5. Submit the form.

## Expected Result

- Expense is saved.
- New expense appears in the list with the entered description.
