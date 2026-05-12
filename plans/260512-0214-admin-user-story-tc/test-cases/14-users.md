# Module: Users — Nhân sự (`/users`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/users/_content.tsx`, `UserDrawer`, `_components/user-row-actions`.
> Existing TC: TC-USER-001..005.
> Roles: `owner | manager | staff | customer`.

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/users` | Search. Role filter? (verify). Columns: avatar, name, email, phone, role badge, isActive. CRUD via UserDrawer. Row actions: edit, deactivate/reactivate, reset password (?). |

**Role tone**: owner=amber, manager=indigo, staff=blue, customer=gray.

---

## (I) Interaction Test Cases

### US-USER-I001 — Search by name/email/phone

Debounce 300ms.

### US-USER-I002 — Role filter

**Acceptance Criteria**: Filter role=owner/manager/staff. "Customer" usually excluded from this list.

### US-USER-I003 — UserDrawer create

**Acceptance Criteria**:
- AC1 (Required**): fullName, email/username, password, role.
- AC2 (Email unique**): Server enforce.
- AC3 (Password strength**): Min length, complexity (verify).
- AC4 (Default role**): Likely staff.
- AC5 (Submit success**): Invalidate, close drawer.

### US-USER-I004 — UserRowActions menu

**Acceptance Criteria** (`_components/user-row-actions.tsx`):
- AC1 (Edit**): Open drawer.
- AC2 (Deactivate**): Confirm dialog → flip isActive.
- AC3 (Reset password**): Verify if exists.

### US-USER-I005 — Role badge colors

owner=amber, manager=indigo, staff=blue.

---

## (B) Business Test Cases

### US-USER-B001 — Create internal user (TC-USER-001)

**Acceptance Criteria**:
- AC1 (Internal flag**): `isInternal=true` for owner/manager/staff (vs customer).
- AC2 (Owner-only create**): Verify only Owner can create owner.
- AC3 (Manager creates staff**): Verify policy.

### US-USER-B002 — Update profile + role (TC-USER-002)

**Acceptance Criteria**:
- AC1 (Cannot self-demote**): Owner cannot change own role to staff (avoid lockout). Verify.
- AC2 (Audit log**): Role change logged.

### US-USER-B003 — Deactivate blocks access (TC-USER-003)

**Acceptance Criteria**:
- AC1 (Flag set**): isActive=false.
- AC2 (Session revoked**): Active sessions invalidated (force re-login).
- AC3 (Login attempt blocked**): 401 "Tài khoản đã ngừng hoạt động".

### US-USER-B004 — Validation (TC-USER-004)

**Acceptance Criteria**:
- AC1 (Email format**): Invalid → 400.
- AC2 (Duplicate email**): 409.
- AC3 (Password min length**): < 8 → 400 (verify).
- AC4 (Role enum**): Invalid role → 400.

### US-USER-B005 — Reactivate (TC-USER-005)

**Acceptance Criteria**: Flip isActive=true → access restored.

### US-USER-B006 — RBAC self-edit

**Acceptance Criteria**:
- AC1 (Self profile**): User can edit own email/phone/avatar (verify).
- AC2 (Cannot delete self**).
- AC3 (Cannot change own role**).

### US-USER-B007 — Password hashed in DB

**Acceptance Criteria**:
- AC1 (bcrypt/argon2**): Verify password storage hash.
- AC2 (Reset password rotates**): Old password no longer works.

---

## Linked TC-IDs

TC-USER-001..005 — all `needs-fix`. Extended by US-USER-I*/B*.
TC-AUTH-014 (Inactive User Session Revocation) ≈ US-USER-B003 AC2.

## Notes

- UserDrawer not walked.
- 2FA / passkey? Not observed.
- Audit log for role changes? Not observed.
- Self-service password reset? Verify.
