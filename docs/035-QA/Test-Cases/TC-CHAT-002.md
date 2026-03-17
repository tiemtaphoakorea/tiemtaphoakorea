---
id: TC-CHAT-002
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-002: Guest Identification & Room Creation

## Pre-conditions

- Chat widget available on storefront.
- No existing customer profile with phone 0901234567.

## Test Steps

1. Open chat widget as a guest.
2. Enter Name "Nguyễn Văn A" and Phone "0901234567".
3. Submit to start chat.

## Expected Result

- System creates a customer profile (guest) and a chat room.
- Customer is attached to the room and can send messages immediately.
