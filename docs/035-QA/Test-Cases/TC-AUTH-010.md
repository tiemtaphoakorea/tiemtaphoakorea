---
id: TC-AUTH-010
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-010: Role-Based Access Restrictions by Module

## Pre-conditions

- Staff account exists and can log in.
- Manager account exists and can log in.

## Test Steps

1. Log in as Staff.
2. Attempt to access Finance/Expenses page.
3. Attempt to access Users management page.
4. Log in as Manager.
5. Attempt to access Finance/Expenses page.

## Expected Result

- Staff is blocked from Finance/Expenses, Analytics và Users pages.
- Manager bị chặn khỏi Finance/Expenses và Users pages nhưng có thể truy cập Analytics và các module vận hành.
- Unauthorized access results in redirect hoặc 401/403.

## Related Docs

- [[Spec-Authentication-Authorization]]
