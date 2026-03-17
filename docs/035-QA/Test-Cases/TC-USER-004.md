---
id: TC-USER-004
type: test-case
status: draft
feature: User Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-USER-004: Create User Validation Errors

## Pre-conditions

- Logged in as Owner or Admin.
- On Users page.

## Test Steps

1. Click "Add User".
2. Submit with missing Full Name and Email.
3. Enter invalid email format and submit.
4. Submit with missing Role.

## Expected Result

- Required field errors are shown for Full Name, Email, and Role.
- Invalid email format is rejected.
- User is not created.

## Related Docs

- [[Spec-Authentication-Authorization]]
