---
id: TC-USER-001
type: test-case
status: draft
feature: User Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-USER-001: Create Internal User

## Pre-conditions

- Logged in as Owner or Admin with user management access.
- On Users page.

## Test Steps

1. Click "Add User".
2. Enter Full Name, Email, Phone, Role = Staff.
3. Click "Create".

## Expected Result

- User is created and appears in the list with role "staff".
- User status is active.

## Related Docs

- [[Spec-Authentication-Authorization]]
