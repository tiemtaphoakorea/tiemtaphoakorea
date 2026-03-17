---
id: TC-AUTH-008
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-008: Staff Login & Role Restrictions

## Pre-conditions

- Staff account exists with role = `staff`.
- User is on the Admin Login page (`/login`, admin subdomain).

## Test Steps

1. Enter valid Staff credentials.
2. Click "Đăng nhập".
3. Verify redirection to Admin Dashboard (`/`, admin subdomain).
4. Verify restricted menus/pages (e.g., "Reports" or "Settings") are not visible.
5. Attempt to access a restricted page via URL directly.

## Expected Result

- Login succeeds and redirects to `/`.
- UI hides restricted areas for Staff.
- Direct URL access to restricted pages is blocked or redirected to `/unauthorized`.
