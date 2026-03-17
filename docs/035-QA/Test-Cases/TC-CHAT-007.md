---
id: TC-CHAT-007
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-007: Message History Pagination

## Pre-conditions

- Chat room has more than 100 messages.

## Test Steps

1. Open the chat room.
2. Scroll up to load older messages.

## Expected Result

- Older messages load incrementally without duplicates.
- Scroll position remains stable after loading.
