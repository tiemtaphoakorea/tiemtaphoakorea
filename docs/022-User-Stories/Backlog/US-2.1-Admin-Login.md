---
id: US-2.1
type: story
status: open
priority: high
epic: EPIC-002
points: 3
---

# US-2.1: Admin Login

**As an** Admin (Owner/Manager/Staff),
**I want to** log in using my email and password,
**So that** I can access the management dashboard securely.

## Acceptance Criteria

- [ ] **AC1**: User can enter Email and Password.
- [ ] **AC2**: System validates credentials against Supabase Auth.
- [ ] **AC3**: On success, redirect to `/admin/dashboard`.
- [ ] **AC4**: On failure, show "Invalid email or password" error message.
- [ ] **AC5**: Session persists for 7 days (or until logout).
- [ ] **AC6**: Accessing a protected route without login redirects to `/login`.

## Technical Notes

- Use Supabase `auth.signInWithPassword()`.
- Store session in HttpOnly cookie using Next.js `cookies()` (via Supabase SSR helpers).
