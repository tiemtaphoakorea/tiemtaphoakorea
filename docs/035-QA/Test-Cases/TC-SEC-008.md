---
id: TC-SEC-008
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-008: CSRF Protection on State-Changing Requests

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. Trigger a POST/PUT/DELETE request without CSRF token (if required).
2. Trigger the same request with valid CSRF token.

## Expected Result

- Missing token requests are rejected.
- Requests with valid token succeed.

## Related Docs

- [[Spec-Authentication-Authorization]]
