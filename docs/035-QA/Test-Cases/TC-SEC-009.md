---
id: TC-SEC-009
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-009: Rate Limiting on Login Attempts

## Pre-conditions

- Login page accessible.

## Test Steps

1. Attempt login with invalid credentials repeatedly.
2. Observe lockout or rate limit response.

## Expected Result

- Excessive attempts are throttled or blocked.
- Rate-limit response is returned.

## Related Docs

- [[Spec-Authentication-Authorization]]
