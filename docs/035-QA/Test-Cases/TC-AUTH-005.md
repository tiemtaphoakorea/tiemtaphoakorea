---
id: TC-AUTH-005
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-005: Admin Logout

## Pre-conditions

- Admin user is logged in.

## Test Steps

1. Click "Logout" in the Admin UI.
2. Attempt to access any protected admin route (e.g., `/`, admin subdomain).

## Expected Result

- Session cookie is cleared.
- User is redirected to `/login` (admin subdomain).
- Protected routes are no longer accessible without re-login.
