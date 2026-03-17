---
id: TC-AUTH-006
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-006: Admin Route Protection & Session Refresh

## Pre-conditions

- Admin routes are protected by middleware.

## Test Steps

1. Open a new browser session with no cookies.
2. Navigate directly to `/` (admin subdomain).
3. Login, then manually expire or delete the session cookie.
4. Refresh `/` (admin subdomain).

## Expected Result

- Step 2: User is redirected to `/login`.
- Step 4: If session is invalid, user is redirected to `/login`; if refresh token is valid, session is refreshed and access continues.
