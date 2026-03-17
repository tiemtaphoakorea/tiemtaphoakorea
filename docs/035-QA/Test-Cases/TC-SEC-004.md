---
id: TC-SEC-004
type: test-case
status: draft
feature: Security
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Chat-System]]
---

# TC-SEC-004: XSS Injection Blocked in Chat Messages

## Pre-conditions

- Logged in as Admin.
- Active chat room.

## Test Steps

1. Send message with payload: `<script>alert(1)</script>`.
2. Send message with HTML injection: `<img src=x onerror=alert(1)>`.

## Expected Result

- Payload is escaped or stripped.
- No script execution occurs in chat view.

## Related Docs

- [[Spec-Chat-System]]
