---
id: TC-CHAT-001
type: test-case
status: active
feature: Real-time Chat
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-001: Admin-Customer Chat Flow

## Pre-conditions

- Admin logged into dashboard.
- Customer on storefront page.

## Test Steps

1. Customer opens chat widget.
2. Customer sends message: "Hello, is product X available?".
3. Admin sees new chat notification.
4. Admin opens conversation.
5. Admin replies: "Yes, we have it in stock!".
6. Customer receives reply in real-time.
7. Customer uploads an image.
8. Admin receives image.

## Expected Result

- Messages appear in real-time (< 2s delay).
- Image uploads display correctly.
- Unread count updates appropriately.
