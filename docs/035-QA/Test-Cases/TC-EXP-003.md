---
id: TC-EXP-003
type: test-case
status: active
feature: Expense Management
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Finance-Accounting]]
---

# TC-EXP-003: Validate Required Fields for Expense

## Pre-conditions

- Logged in as Admin.
- On Expenses page (`/expenses`).

## Test Steps

1. Click "Thêm chi phí" (Add Expense).
2. Leave required fields empty (e.g. amount).
3. Submit the form without filling required data.

## Expected Result

- Form does not submit successfully.
- Required validation is shown (e.g. HTML5 required on amount, or UI error message).
