---
id: TC-SEC-013
type: test-case
status: missing
feature: Security
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-013: HTTP Method Override Attack

## Pre-conditions

- Authenticated as Staff (role that cannot DELETE orders).
- At least one order exists.

## Test Steps

1. Log in as Staff.
2. Send a `POST /api/admin/orders/:id` request with header `X-HTTP-Method-Override: DELETE`.
3. Check the HTTP response status.
4. Verify the order still exists via `GET /api/admin/orders/:id`.

## Expected Result

- Server ignores the `X-HTTP-Method-Override` header.
- Order is NOT deleted.
- Response is appropriate for a POST request (likely 405 Method Not Allowed or 403 Forbidden based on role).

## Spec File

`tests/e2e/security/method-override.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No test checks whether the API framework honors `X-HTTP-Method-Override` headers.
- If a framework middleware respects this header, a staff user could bypass DELETE authorization.

## Coverage Gaps

- Verify `X-HTTP-Method-Override` ignored on all admin routes
