---
id: TC-AUTH-011
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-011: Owner-Only API Access

## Pre-conditions

- Staff account exists and can log in.
- Owner account exists.

## Test Steps

1. Log in as Staff.
2. Call owner-only API endpoints (users, expenses, finance/profit reports).
3. Log in as Owner.
4. Call the same endpoints.

## Expected Result

- Staff receives 401/403 for owner-only endpoints.
- Owner receives successful responses.

## Related Docs

- [[Spec-Authentication-Authorization]]
