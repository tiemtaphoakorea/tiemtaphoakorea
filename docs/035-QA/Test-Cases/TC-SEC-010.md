---
id: TC-SEC-010
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-010: RLS Policy Enforcement for Customers and Orders

## Pre-conditions

- Logged in as Staff.
- Logged in as Admin.

## Test Steps

1. As Staff, attempt to access records outside allowed scope (if scoped by role).
2. As Admin, access the same records.

## Expected Result

- Staff access is restricted by RLS.
- Admin access succeeds.

## Related Docs

- [[Spec-Authentication-Authorization]]
