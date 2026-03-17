---
id: TC-AUTH-004
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-004: Admin Login - Invalid Role / Missing Profile Blocked

## Pre-conditions

- An auth user exists but has no `profiles` record, or role is not in {owner, manager, staff}.
- User is on the Admin Login page (`/login`, admin subdomain).

## Test Steps

1. Enter the user's email and password.
2. Click "Đăng nhập".

## Expected Result

- Login is rejected with "Không có quyền truy cập" (or equivalent access denied message).
- User stays on `/login`.
