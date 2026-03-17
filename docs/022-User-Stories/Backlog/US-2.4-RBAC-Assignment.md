---
id: US-2.4
type: story
status: open
priority: high
epic: EPIC-002
points: 5
---

# US-2.4: Role Assignment (RBAC)

**As an** Owner,
**I want to** assign roles (Manager, Staff) to users,
**So that** I can control their access levels to sensitive modules.

## Acceptance Criteria

- [ ] **AC1**: Only users with role `owner` can access the Role Management UI.
- [ ] **AC2**: Owner can view a list of all users and their current roles.
- [ ] **AC3**: Owner can update a user's role to `manager`, `staff`, or `owner`.
- [ ] **AC4**: System prevents an Owner from removing their own `owner` role (prevent lockout).
- [ ] **AC5**: Role changes take effect immediately for RLS policies (or on next token refresh).

## Technical Notes

- Update `profiles` table `role` column.
- Use Supabase Edge Function or Admin Client for role updates if RLS prevents users from updating others.
- **Security**: Only `service_role` or `owner` role can update the `role` column.
