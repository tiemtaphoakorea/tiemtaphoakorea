---
id: TC-SEC-001
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-001: Unauthorized API Access Blocked

## Pre-conditions

- No authenticated session.

## Test Steps

1. Call protected admin API endpoints (orders, products, customers, finance).

## Expected Result

- All protected endpoints return 401/403.
- No data is returned.

## Related Docs

- [[Spec-Authentication-Authorization]]
