---
id: TC-AUTH-015
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-015: Direct URL Access Guard

## Pre-conditions

- Staff account exists and can log in.
- Manager account exists and can log in.

## Test Steps

1. Log in as Staff.
2. Directly open URL for Users management.
3. Directly open URL for Finance/Expenses.
4. Log in as Manager.
5. Directly open URL for Users management.

## Expected Result

- Staff is blocked from Users and Finance/Expenses by route guard.
- Manager is blocked from Users if restricted.

## Related Docs

- [[Spec-Authentication-Authorization]]
