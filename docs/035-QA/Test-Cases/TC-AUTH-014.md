---
id: TC-AUTH-014
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-014: Inactive User Session Revocation

## Pre-conditions

- Staff account exists and is active.

## Test Steps

1. Log in as Staff and keep session active.
2. As Admin, deactivate the Staff account.
3. Attempt to access a protected page with the existing Staff session.

## Expected Result

- Session is rejected or redirected to login.
- Protected data is not accessible after deactivation.

## Related Docs

- [[Spec-Authentication-Authorization]]
