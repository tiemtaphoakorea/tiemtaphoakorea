---
id: TC-CHAT-014
type: test-case
status: missing
feature: Real-time Chat
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Chat-System]]
---

# TC-CHAT-014: Guest Session Expiry and Re-Identification

## Pre-conditions

- Guest storefront accessible.
- Guest has previously initiated a chat with an associated phone number.

## Test Steps

1. Guest opens storefront and initiates a chat (provides phone number).
2. Guest sends a message and verifies it appears in the room.
3. Clear the guest session (delete cookies or local storage).
4. Re-open the storefront.
5. Re-identify as the same guest (provide the same phone number).
6. Verify the same chat room is reused (not a new room created).
7. Verify previous message history is preserved.

## Expected Result

- Same chat room is reused when guest re-identifies with the same phone.
- Message history is preserved across session expiry.
- No duplicate rooms are created.

## Spec File

`tests/e2e/chat/session-reuse.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- **TC-CHAT-008** (`room-reuse.spec.ts`) is intended to test room reuse but the file **fails at module load time** due to a broken `STOREFRONT_BASE_URL` import from `"../helpers/api"`.
- No functional test verifies guest re-identification after session expiry.

## Coverage Gaps

- Session expiry and re-identification
- Message history preservation
- Duplicate room prevention
