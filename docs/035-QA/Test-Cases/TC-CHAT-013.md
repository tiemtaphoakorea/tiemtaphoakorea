---
id: TC-CHAT-013
type: test-case
status: missing
feature: Real-time Chat
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-013: Attachment Upload Valid File (Baseline)

## Pre-conditions

- Admin logged in.
- An active chat room exists.
- A valid JPEG file under the size limit is available.

## Test Steps

1. Navigate to the chat room.
2. Click the attachment upload button.
3. Select a valid JPEG file (e.g., `test-image.jpg`, < 1MB).
4. Confirm the upload.
5. Verify the API response is 200/201.
6. Verify the attachment URL is returned in the response.
7. Verify the attachment appears in the chat message list.

## Expected Result

- Valid image upload succeeds with 200/201.
- Attachment URL is accessible and returns the image.
- Attachment is displayed in the chat thread.

## Spec File

`tests/e2e/chat/attachment-upload.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- **TC-CHAT-005** (`admin-messaging.spec.ts`) only tests **invalid** file type upload (expects 500/400). There is no baseline "valid upload" test, which means it is impossible to distinguish "endpoint rejects malicious file" from "endpoint always returns error for all uploads."
- Without a passing baseline, TC-CHAT-005 provides no meaningful security signal.

## Coverage Gaps

- Valid file upload baseline
- Size limit enforcement (file over max size)
- Multiple attachment types (PNG, GIF, WebP)
