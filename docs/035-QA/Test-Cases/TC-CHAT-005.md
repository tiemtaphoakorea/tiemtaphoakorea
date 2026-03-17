---
id: TC-CHAT-005
type: test-case
status: draft
feature: Real-time Chat
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-005: Image Upload Validation

## Pre-conditions

- Customer or Admin in an active chat room.

## Test Data

| Case | File Type | Size | Expected |
| ---- | --------- | ---- | -------- |
| A    | image/jpeg | 2MB | Upload succeeds |
| B    | image/png | 6MB | Error: max 5MB |
| C    | image/gif | 1MB | Error: unsupported type |

## Test Steps

1. Attempt to upload each file.

## Expected Result

- Only JPG/PNG/WebP under 5MB are accepted.
- Errors displayed for invalid files.
