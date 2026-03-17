---
id: TC-CHAT-003
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-003: Admin Inbox - Unread Count & Sorting

## Pre-conditions

- Logged in as Admin.
- At least 3 chat rooms with recent messages.

## Test Steps

1. Open Admin Chat Inbox.
2. Verify rooms are sorted by latest message time.
3. Check unread badge count for rooms with new customer messages.

## Expected Result

- Rooms sort by latest message (newest first).
- Unread count matches number of unread customer messages.
