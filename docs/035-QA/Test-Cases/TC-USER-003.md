---
id: TC-USER-003
type: test-case
status: draft
feature: User Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-USER-003: Deactivate User Blocks Access

## Pre-conditions

- Logged in as Owner or Admin.
- User "Staff B" exists and can log in.

## Test Steps

1. Deactivate user "Staff B" from Users page.
2. Attempt to log in with "Staff B" credentials.

## Expected Result

- Login is denied with a permission/disabled message.
- User remains inactive in the list.

## Related Docs

- [[Spec-Authentication-Authorization]]
