# Module: Login — Đăng nhập admin (`/login`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(public)/login/page.tsx`
> Existing TC: TC-AUTH-001..015 (mixed status).
> Test creds: `admin` / `password123`, `manager` / `password123`, `staff` / `password123`.

## Screen Inventory

| Screen | Notes |
|--------|-------|
| `/login` | Username + Password fields, Submit button. Redirect to `/` (dashboard) on success. |

---

## (I) Interaction Test Cases

### US-LOGIN-I001 — Login form validation

**Acceptance Criteria** (TC-AUTH-002):
- AC1 (Empty fields**): Submit disabled or inline error.
- AC2 (Username required**): "Tên đăng nhập không được trống".
- AC3 (Password min length**): Likely 6+ chars.

### US-LOGIN-I002 — Invalid credentials feedback (TC-AUTH-003)

**Acceptance Criteria**:
- AC1 (Wrong password**): Error message "Sai thông tin đăng nhập".
- AC2 (Non-existent user**): Same generic message (no user enumeration).
- AC3 (Loading state**): Submit button disabled, text "Đang đăng nhập...".

### US-LOGIN-I003 — Password visibility toggle

Verify if "show password" eye icon exists. Recommend if not.

### US-LOGIN-I004 — Enter key submits form

Submit via Enter on password field.

---

## (B) Business Test Cases

### US-LOGIN-B001 — Successful login flow (TC-AUTH-001)

**Acceptance Criteria**:
- AC1 (POST /api/admin/login**): success=true → set `admin_session` cookie (httpOnly).
- AC2 (Cookie flags**) (TC-AUTH-006, TC-SEC-006): HttpOnly, Secure (in prod), SameSite=Strict|Lax.
- AC3 (Redirect**): `/dashboard` or `/`.
- AC4 (Role attached to session**): Subsequent API calls verify role.

### US-LOGIN-B002 — Non-internal user blocked (TC-AUTH-004)

Customer role login admin → 401, no cookie set.

### US-LOGIN-B003 — Inactive user blocked (TC-AUTH-014)

isActive=false → 401.

### US-LOGIN-B004 — Rate limiting (TC-AUTH-007, TC-SEC-009)

**Acceptance Criteria**:
- AC1 (After 5 failed attempts**): Lockout window (e.g., 15 min).
- AC2 (Per IP + per username**): Both axes.
- AC3 (Status code**): 429 (NOT 400/401 — existing false positive).
- AC4 (Recovery**): After window, login works.

### US-LOGIN-B005 — Logout (TC-AUTH-005)

**Acceptance Criteria**:
- AC1 (Click logout**): POST /api/admin/logout.
- AC2 (Cookie cleared**): `admin_session` cookie Max-Age=0 (verify, existing TC needs fix).
- AC3 (Redirect to login**).

### US-LOGIN-B006 — Route protection (TC-AUTH-006, 015)

Middleware blocks `/orders` etc. without cookie → redirect `/login`. Direct URL access guard.

### US-LOGIN-B007 — Session refresh

Active session refreshed on each request? Or fixed TTL? Verify.

### US-LOGIN-B008 — Session fixation prevention (TC-SEC-011 missing)

After login → new session ID issued (cookie rotated).

### US-LOGIN-B009 — Session/token expiry (TC-SEC-012 missing)

Cookie has Max-Age (e.g., 7d). Expired cookie → 401, redirect /login.

### US-LOGIN-B010 — RBAC per role (TC-AUTH-008..013)

- Staff: Limited to orders/products/customers/chat.
- Manager: + reports.
- Owner: All including users/settings.

---

## Linked TC-IDs

TC-AUTH-001..015 (existing). Many `needs-fix` — false positives in:
- TC-AUTH-001 (Role check assertion weak)
- TC-AUTH-003 (Duplicate ID)
- TC-AUTH-005 (Cookie not verified cleared)
- TC-AUTH-007 (Lockout false positive)

TC-SEC-001..013 (security tests) — cross-ref.

## Notes

- Single sign-on (SSO)? Not implemented.
- 2FA / MFA? Not implemented.
- Passkey / WebAuthn? Not implemented.
- "Remember me" longer session? Verify.
- CAPTCHA after N failed attempts? Verify.
- IP allowlist for admin? Verify.
- Audit log of login attempts? Recommend.
