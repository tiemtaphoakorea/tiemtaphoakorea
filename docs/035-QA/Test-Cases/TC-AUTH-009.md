---
id: TC-AUTH-009
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-009: Manager Login & Role Restrictions

## Pre-conditions

- Manager account exists with role = `manager`.
- User is on the Admin Login page (`/login`, admin subdomain).

## Test Steps

1. Enter valid Manager credentials.
2. Click "Đăng nhập".
3. Verify redirection to Admin Dashboard (`/`, admin subdomain).
4. Verify Manager-only allowed areas are visible (operational features, Analytics).
5. Verify Owner-only areas (Users management, Finance/Expenses, chi tiết P&L/Profit reports) are not visible.
6. Attempt to access an Owner-only page (ví dụ `/users`, `/finance`, `/expenses`) via URL trực tiếp.

## Expected Result

- Login succeeds and redirects to `/` (admin subdomain).
- UI hides Owner-only areas for Manager (Users, Finance, Expenses, Profit reports).
- Direct URL access to Owner-only pages is blocked (redirect login/unauthorized hoặc 401/403).
