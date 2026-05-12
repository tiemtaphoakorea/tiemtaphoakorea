# CRM And Chat

## Scope

This domain covers customers, guests, customer profile behavior, chat rooms, chat messages, unread counters, and customer-facing support chat.

## Key Code

| Area | Path |
| --- | --- |
| Customer service | `packages/database/src/services/customer.server.ts` |
| Guest profile service | `packages/database/src/services/guest.server.ts` |
| Chat service | `packages/database/src/services/chat.server.ts` |
| Customer/user profiles schema | `packages/database/src/schema/profiles.ts` |
| Chat schema | `packages/database/src/schema/chat.ts` |
| Shared schemas/constants | `packages/shared/src/schemas`, `packages/shared/src/constants.ts` |

## Business Rules

- Customer records are profiles with role `customer`.
- Customer records do not create usable admin auth.
- Customer phone must be unique among customer profiles.
- Customer records have an active/inactive status and list APIs can filter by that status.
- Owner and manager can toggle customer active status.
- Current order creation does not block inactive customers.
- Customer tier badges are computed in the admin UI from order count and total spent using the current threshold setting.
- Current tier matching uses AND logic between order count and spend thresholds, with loyal checked before frequent.
- Guest profiles use deterministic `guest_` customer codes derived from the guest session ID.
- Long guest session IDs are hashed so generated guest codes fit DB length limits.
- A customer has at most one chat room; `getOrCreateChatRoom` reuses the existing room.
- Chat room list is sorted by latest message timestamp.
- Chat room search matches customer name, customer code, or phone.
- Text messages cannot be empty and cannot exceed the shared text length limit.
- Image messages store `[Hình ảnh]` as content and keep the image URL separately.
- Chat images are limited to JPEG, PNG, or WebP and max 5MB.
- Admin messages increment customer unread count; customer messages increment admin unread count.
- Marking messages as read marks only messages sent by the other party and resets the reader's unread counter.
- Realtime broadcast failures are logged but do not fail the saved message.

Read `docs/current/06-business-rules.md` for customer validation, role boundaries, and open policy gaps.

## Needs Confirmation

- Legacy docs say guest chat can re-identify by phone. Current guest profile creation is session-code based; confirm before adding phone-based dedupe tests.
- Legacy docs mention auto-created chat rooms when admin creates a customer. Current customer creation does not obviously create a chat room; confirm before testing that behavior.
- Legacy docs say inactive customers should be blocked from new orders. Current order creation does not enforce that; confirm before changing tests or service behavior.
