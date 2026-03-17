---
id: TC-SEC-003
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-003: SQL Injection Attempt Blocked

## Pre-conditions

- Logged in as Staff or Admin.

## Test Steps

1. Use search fields with payload: `' OR 1=1 --`.
2. Apply filters with injected payloads.

## Expected Result

- No unexpected data exposure.
- Requests are sanitized; results are normal or empty.

## Related Docs

- [[Spec-Authentication-Authorization]]
