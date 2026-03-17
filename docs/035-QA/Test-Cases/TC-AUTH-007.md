---
id: TC-AUTH-007
type: test-case
status: draft
feature: Authentication
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-007: Admin Login Rate Limiting & Lockout

## Pre-conditions

- Rate limiting configured: max 5 failed attempts per 15 minutes.
- Account lockout after 10 failed attempts (requires admin reset).

## Test Steps

1. Attempt login with wrong password 5 times within 15 minutes.
2. Attempt the 6th login within the same window.
3. Continue failing until 10 total failed attempts.
4. Try login with correct password.

## Expected Result

- Step 2: Login is rate-limited (error message shown, no session created).
- Step 3: Account is locked.
- Step 4: Correct credentials are rejected until admin reset/unlock.
