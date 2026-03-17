---
id: TC-AUTH-013
type: test-case
status: draft
feature: Authentication & Authorization
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-AUTH-013: Manager Access to Reports vs Users

## Pre-conditions

- Manager account exists and can log in.

## Test Steps

1. Log in as Manager.
2. Access Dashboard and Reports pages.
3. Attempt to access Users management page.

## Expected Result

- Manager can access Dashboard/Reports as configured.
- Manager is blocked from Users management if restricted.

## Related Docs

- [[Spec-Authentication-Authorization]]
