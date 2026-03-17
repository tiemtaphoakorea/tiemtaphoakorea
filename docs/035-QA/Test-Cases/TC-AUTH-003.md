---
id: TC-AUTH-003
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-003: Admin Login - Invalid Credentials

## Pre-conditions

- Admin account exists.
- User is on the Admin Login page (`/login`, admin subdomain).

## Test Data

| Case | Email             | Password     | Expected Error                          |
| ---- | ----------------- | ------------ | ---------------------------------------- |
| A    | "wrong@shop.com" | "correct"   | "Email hoặc mật khẩu không đúng"       |
| B    | "admin@shop.com" | "wrongpass" | "Email hoặc mật khẩu không đúng"       |

## Test Steps

1. For each case in Test Data, input Email/Password.
2. Click "Đăng nhập".

## Expected Result

- Authentication fails with the expected error.
- No session cookie is set.
