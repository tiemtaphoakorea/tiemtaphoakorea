# Module: Chat — Tin nhắn (`/chat`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/chat/_content.tsx` (~10KB)
> Existing TC: TC-CHAT-001..014 (most `needs-fix`).
> Real-time: Supabase Realtime channels.
> AI agent: optional auto-reply (configured via `AI_AGENT_*` env).

## Screen Inventory

| Screen | Notes |
|--------|-------|
| Inbox `/chat` | Split: left = room list (sorted by latest message, unread badge), right = active conversation. Message input + image upload. Mark as read on focus. |

---

## (I) Interaction Test Cases

### US-CHAT-I001 — Real-time message delivery

**Acceptance Criteria** (TC-CHAT-004):
- AC1 (Supabase Realtime subscribe**): On mount → subscribe `chat_messages` channel for active room.
- AC2 (New message arrives < 1s**): Other side sends → admin UI shows within 1s.
- AC3 (Optimistic send**): Admin sends → immediately shown locally; reconcile on server ACK.
- AC4 (Out-of-order handling**): Messages arrive with timestamps; sorted client-side.

### US-CHAT-I002 — Room list unread sort + badge

**Acceptance Criteria** (TC-CHAT-003):
- AC1 (Sort latest first**): Rooms ordered by latest message timestamp DESC.
- AC2 (Unread count badge**): Per room.
- AC3 (Realtime update**): New message → room jumps to top.
- AC4 (Click room**): Open conversation, mark read.

### US-CHAT-I003 — Mark as read on room open

**Acceptance Criteria** (TC-CHAT-006):
- AC1 (On focus**): All unread messages in room → `read_at` timestamp set.
- AC2 (Visible viewport**): IntersectionObserver for per-message read? Or just bulk-mark?
- AC3 (Sync across tabs**): Mark-read in tab A → tab B updates unread badge.

### US-CHAT-I004 — Image upload validation (TC-CHAT-005)

**Acceptance Criteria**:
- AC1 (MIME**): image/png|jpeg|webp.
- AC2 (Size limit**): Max 5MB.
- AC3 (Server validate**): Reject invalid MIME with 400 (NOT 500 — existing bug).
- AC4 (Preview**): Show preview before send.
- AC5 (Send + receive**): Receiver sees image rendered inline.

### US-CHAT-I005 — Message validation (TC-CHAT-009)

**Acceptance Criteria**:
- AC1 (Empty message blocked**): Submit disabled.
- AC2 (Max length**): Verify char limit (e.g., 2000 chars).
- AC3 (Strip control chars**): Sanitize newlines vs preserve format.

### US-CHAT-I006 — Pagination message history (TC-CHAT-007)

**Acceptance Criteria**:
- AC1 (Initial load**): Last 50 messages.
- AC2 (Scroll up to load older**): Infinite scroll or "Load older" button.
- AC3 (Preserve scroll position**): On load older → don't jump.

---

## (B) Business Test Cases

### US-CHAT-B001 — Guest identification & room creation (TC-CHAT-002)

**Acceptance Criteria**:
- AC1 (Phone-based dedupe**): Guest with same phone → reuse room (TC-CHAT-008).
- AC2 (New guest**): Create new room with profile.
- AC3 (Session token**): Guest gets session cookie; expires (TC-CHAT-014 missing).

### US-CHAT-B002 — Concurrent send + mark-read order consistency (TC-CHAT-011, 012)

**Acceptance Criteria**:
- AC1 (Messages ordered**): Server timestamp authoritative; client display sorted.
- AC2 (No lost messages**): Concurrent send from same user → all persisted.

### US-CHAT-B003 — Admin chat route guard (TC-CHAT-010)

**Acceptance Criteria**: Guest cannot access /chat admin route → 403/redirect.

### US-CHAT-B004 — XSS in message content (TC-SEC-004)

**Acceptance Criteria**:
- AC1 (Server escape**): Store as-is; render with React (auto-escape).
- AC2 (Markdown? **): If supported, link/img must not allow javascript:.

### US-CHAT-B005 — AI agent auto-reply (if `AI_AGENT_ENABLED=true`)

**Acceptance Criteria**:
- AC1 (Trigger**): New guest message → AI agent generates reply within N seconds.
- AC2 (Safe mode**): `AI_AGENT_SAFE_MODE=true` → mask PII before sending to model.
- AC3 (Loop cap**): `AI_AGENT_MAX_TURNS=4` → no infinite loop.
- AC4 (Override prompt**): `AI_AGENT_SYSTEM_PROMPT` precedence.
- AC5 (Disable per room**): Admin can pause AI for specific room.

### US-CHAT-B006 — File upload baseline (TC-CHAT-013 missing)

**Acceptance Criteria**: Valid file upload returns 200 + URL stored as message attachment.

### US-CHAT-B007 — Guest session expiry & re-identification (TC-CHAT-014 missing)

**Acceptance Criteria**:
- AC1 (TTL**): Guest session expires after X days.
- AC2 (Re-identify with same phone**): Reuse same profile + room.
- AC3 (Different phone same browser**): New profile + room.

---

## Linked TC-IDs

TC-CHAT-001..014 (existing) — many needs-fix or dead code. Notable:
- TC-CHAT-001, 002, 008: dead code (broken imports per TEST-STATUS.md).
- TC-CHAT-005: false positive (toBe(500) for MIME).
- TC-CHAT-006: false positive (if-guard).
- TC-CHAT-013, 014: missing.

## Notes

- AI agent flow not deeply verified — needs separate spec.
- Voice/video call? Not observed.
- Typing indicator? Verify.
- Read receipts UI? Verify if shown to guest.
- Notification (push/email/Telegram) for new messages? Verify.
- Multi-admin handoff? Verify if multiple admins can claim a room.
