---
id: TC-SEC-006
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-006: Session Cookie Security Flags

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. Inspect auth/session cookies in browser.

## Expected Result

- Cookies are set with HttpOnly and Secure flags.
- SameSite policy is set appropriately.

## Related Docs

- [[Spec-Authentication-Authorization]]
