---
id: TC-CHAT-012
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-012: Concurrent Messages Order Consistency

## Pre-conditions

- Logged in as Admin.
- Active chat room with guest.
- Two sessions open: Admin and Guest.

## Test Steps

1. Admin sends a message at the same time the Guest sends a message.
2. Refresh both chat views.

## Expected Result

- Messages are ordered consistently by timestamp.
- No duplicated or missing messages appear.

## Related Docs

- [[Spec-Chat-System]]
