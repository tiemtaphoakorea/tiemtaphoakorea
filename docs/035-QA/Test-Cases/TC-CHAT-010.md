---
id: TC-CHAT-010
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-010: Guest Cannot Access Admin Chat Routes

## Pre-conditions

- Not logged in as admin.
- Public storefront session.

## Test Steps

1. Attempt to access admin chat page URL directly.
2. Attempt to call admin chat API endpoint.

## Expected Result

- Access is blocked (redirect or 401/403).
- No admin chat data is returned.

## Related Docs

- [[Spec-Chat-System]]
