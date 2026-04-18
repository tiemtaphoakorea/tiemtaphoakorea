---
id: TC-SEC-011
type: test-case
status: missing
feature: Security
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-011: Session Fixation Prevention

## Pre-conditions

- Admin login page accessible.
- Ability to capture the session cookie value before login.

## Test Steps

1. Navigate to `/login` (admin subdomain) without logging in.
2. Capture the current session cookie value (if any) — note as `preLognSession`.
3. Log in with valid admin credentials.
4. After redirect to dashboard, capture the current session cookie value — note as `postLoginSession`.
5. Compare `preLoginSession` and `postLoginSession`.

## Expected Result

- The session identifier changes after successful login.
- `postLoginSession !== preLoginSession` (a new session is issued on authentication).
- Prevents an attacker who obtained a pre-login session token from reusing it post-login.

## Spec File

`tests/e2e/security/session-fixation.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No test anywhere verifies session token rotation on login.
- Session fixation is a well-known OWASP vulnerability; absence of this test is a coverage gap.

## Coverage Gaps

- Verify session rotation on login
- Verify session invalidation on logout
