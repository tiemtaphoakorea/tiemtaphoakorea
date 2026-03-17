---
id: TC-SEC-002
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-002: Role Escalation Attempt Blocked

## Pre-conditions

- Logged in as Staff.

## Test Steps

1. Attempt to update own role to admin/owner via API.
2. Attempt to update another user role via API.

## Expected Result

- Requests are rejected with 403.
- No role changes occur.

## Related Docs

- [[Spec-Authentication-Authorization]]
