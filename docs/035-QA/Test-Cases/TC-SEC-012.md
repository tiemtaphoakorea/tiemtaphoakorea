---
id: TC-SEC-012
type: test-case
status: missing
feature: Security
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-012: Session / Token Expiry Enforcement

## Pre-conditions

- Valid admin session exists.
- Ability to manually modify or expire the session cookie.

## Test Steps

1. Log in as admin and capture the `admin_session` cookie.
2. Manually tamper with the cookie value (modify signature or expiry).
3. Send a request to `GET /api/admin/users` with the tampered cookie.
4. Alternatively, wait for session expiry and then send the same request.

## Expected Result

- Tampered or expired session cookie is rejected with HTTP 401.
- API returns no user data in the response body.
- Client is redirected to `/login`.

## Spec File

`tests/e2e/security/session-expiry.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No test verifies that expired or forged session tokens are rejected.
- The `unauthorized-access.spec.ts` tests unauthenticated (no cookie) access, but not tampered-cookie access.

## Coverage Gaps

- Tampered session cookie rejection
- Expired session cookie rejection
- Concurrent session invalidation (logout from one session revokes others)
