---
id: TC-SEC-005
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Authentication-Authorization]]
---

# TC-SEC-005: Sensitive Data Not Exposed in Responses

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. Call user/profile endpoints.
2. Call order detail endpoints.
3. Inspect response payloads.

## Expected Result

- No passwords, tokens, or secrets in responses.
- Only expected fields are returned.

## Related Docs

- [[Spec-Authentication-Authorization]]
