---
id: TC-AUTH-002
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-002: Admin Login - Validation Errors

## Pre-conditions

- User is on the Admin Login page (`/login`, admin subdomain).

## Test Data

| Case | Email              | Password | Expected Error                          |
| ---- | ------------------ | -------- | ---------------------------------------- |
| A    | *(empty)*          | *(empty)*| "Vui lòng nhập đầy đủ thông tin"       |
| B    | "not-an-email"    | "123456"| "Email không hợp lệ"                   |
| C    | "admin@shop.com"  | "123"   | "Mật khẩu phải có ít nhất 6 ký tự"     |

## Test Steps

1. For each case in Test Data, input Email/Password.
2. Click "Đăng nhập".

## Expected Result

- Form shows the correct validation error message per case.
- No session is created and user stays on `/login`.
