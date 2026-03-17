---
id: TC-AUTH-012
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-012: Staff Access Limited to Orders, Products, Customers

## Pre-conditions

- Staff account exists and can log in.

## Test Steps

1. Log in as Staff.
2. Access Orders page and create a draft order.
3. Access Products list.
4. Access Customers list.
5. Attempt to access Users, Expenses/Finance, and Settings pages.

## Expected Result

- Staff can access Orders, Products, Customers.
- Staff is blocked from Users, Finance/Expenses, and Settings.

## Related Docs

- [[Spec-Authentication-Authorization]]
