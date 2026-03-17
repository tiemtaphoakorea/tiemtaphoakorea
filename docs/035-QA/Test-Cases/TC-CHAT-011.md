---
id: TC-CHAT-011
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-011: Concurrent Send and Mark-as-Read

## Pre-conditions

- Logged in as Admin.
- Active chat room with guest.
- Two sessions open: Admin A and Admin B.

## Test Steps

1. Guest sends a new message.
2. Admin A opens the chat and marks messages as read.
3. At the same time, Admin B sends a reply message.

## Expected Result

- Read status is updated correctly for the guest message.
- Admin reply is delivered and visible in both sessions.
- Unread counters reflect the latest state without negative counts.

## Related Docs

- [[Spec-Chat-System]]
