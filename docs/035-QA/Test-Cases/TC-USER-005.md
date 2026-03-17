---
id: TC-USER-005
type: test-case
status: draft
feature: User Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-USER-005: Reactivate User Restores Access

## Pre-conditions

- Logged in as Owner or Admin.
- User "Staff C" exists and is inactive.

## Test Steps

1. Reactivate user "Staff C" from Users page.
2. Log in with "Staff C" credentials.

## Expected Result

- User status changes to active.
- Login succeeds for reactivated user.

## Related Docs

- [[Spec-Authentication-Authorization]]
