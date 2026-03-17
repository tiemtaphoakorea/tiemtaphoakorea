---
id: TC-USER-002
type: test-case
status: draft
feature: User Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-USER-002: Update User Profile & Role

## Pre-conditions

- Logged in as Owner or Admin.
- User "Staff A" exists.

## Test Steps

1. Edit user "Staff A".
2. Update Phone and Role to Manager.
3. Save changes.

## Expected Result

- Updated phone and role are shown in the user list.
- Changes persist after page reload.

## Related Docs

- [[Spec-Authentication-Authorization]]
