---
id: TC-CHAT-009
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-009: Message Validation

## Pre-conditions

- Admin or guest in an active chat room.

## Test Data

| Case | Message | Expected Error |
| ---- | ------- | -------------- |
| A    | *(empty)* | "Vui lòng nhập tin nhắn" |
| B    | "   " | "Tin nhắn không được để trống" |
| C    | 2001 characters | "Tin nhắn tối đa 2000 ký tự" |

## Test Steps

1. Attempt to send each message case.

## Expected Result

- System blocks invalid messages with correct error.
- No message is sent for invalid cases.
