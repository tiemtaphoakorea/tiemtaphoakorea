---
id: TC-AUTH-001
type: test-case
status: review
feature: Authentication
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-001: Admin Login & Role Check

## Pre-conditions

- Database seeded with Owner, Manager, Staff accounts.
- User is on the Admin Login page (`/login`, admin subdomain).

## Test Steps

1. Enter valid Owner credentials.
2. Click "Login".
3. Verify redirection to Admin Dashboard (`/`, admin subdomain).
4. Verify "Settings" and "Reports" are visible.
5. Logout.
6. Enter valid Staff credentials.
7. Click "Login".
8. Verify "P&L Report" is NOT accessible/visible.

## Expected Result

- Successful login redirects to Admin Dashboard.
- UI elements adapt based on RBAC rules (Owner sees all, Staff sees limited).
