---
reviewer: reviewer-3
focus: RBAC — Role-Based Access Completeness
date: 2026-04-30
---

# RBAC Coverage Review — admin-test-cases vs admin-user-stories

## Scope
- Roles: Owner, Manager, Staff
- Modules checked: 13 (Auth/Sidebar, Dashboard, Products, Categories, Orders, Customers, Suppliers, Supplier Orders, Debts, Expenses, Analytics, Users, Settings, Chat)
- Permission spec source: US-AUTH-003 + role tags on each user story

## Permission Matrix (expected, per user stories)

| Module | Owner | Manager | Staff |
|---|---|---|---|
| Dashboard | Y | Y | Y |
| Analytics | Y | Y | N |
| Products | Y | Y | Y |
| Categories | Y | Y | Y |
| Orders | Y | Y | Y |
| Customers | Y | Y | Y |
| Suppliers | Y | Y | Y |
| Supplier Orders | Y | Y | Y |
| Debts | Y | Y | Y |
| Chat | Y | Y | Y |
| Expenses | Y | N | N |
| Users | Y | N | N |
| Settings | Y | N | N |

## Coverage Matrix (TC IDs; "MISSING" = no TC)

Legend: `+` = positive access TC (allowed role can use), `-` = negative TC (forbidden role blocked). N/A = role is allowed (no negative needed) or forbidden (no positive needed).

| Module | Owner+ | Owner− | Manager+ | Manager− | Staff+ | Staff− |
|---|---|---|---|---|---|---|
| Dashboard | TC-DASH-001 (implicit) | N/A | TC-DASH-001 (implicit) | N/A | TC-DASH-001 (implicit) | N/A |
| Analytics | MISSING (only implicit in TC-ANALYTICS-001) | N/A | TC-AUTH-012 | N/A | N/A | TC-AUTH-013, TC-ANALYTICS-006 |
| Products | MISSING | N/A | MISSING | N/A | TC-PROD-019 | N/A |
| Categories | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Orders | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Customers | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Suppliers | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Supplier Orders | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Debts | MISSING | N/A | TC-DEBT-010 | N/A | TC-DEBT-009 | N/A |
| Chat | MISSING | N/A | MISSING | N/A | MISSING | N/A |
| Expenses | TC-EXP-001 | N/A | N/A | TC-EXP-009 | N/A | TC-EXP-008, TC-AUTH-011 |
| Users | TC-USERS-001 | N/A | N/A | TC-USERS-009 | N/A | TC-USERS-006, TC-AUTH-010, TC-AUTH-008 (sidebar) |
| Settings | TC-SETTINGS-001 | N/A | N/A | TC-SETTINGS-012 | N/A | TC-SETTINGS-006 |

### Sidebar Visibility Sub-Matrix (US-AUTH-003)

| Sidebar Item | Owner sees | Manager sees | Staff sees | TC for Staff hidden | TC for Manager hidden |
|---|---|---|---|---|---|
| Users | Y | N | N | TC-AUTH-008 | MISSING |
| Expenses | Y | N | N | MISSING (only URL test TC-AUTH-011/TC-EXP-008) | TC-AUTH-009 |
| Analytics | Y | Y | N | MISSING (only URL test) | N/A |
| Settings | Y | N | N | MISSING | MISSING |
| Operational items (Products/Orders/etc.) | Y | Y | Y | N/A | N/A |

### Direct-URL Block Sub-Matrix (forbidden role)

| Module | Staff direct URL blocked | Manager direct URL blocked |
|---|---|---|
| Analytics | TC-AUTH-013 (+ TC-ANALYTICS-006) | N/A |
| Users | TC-AUTH-010, TC-USERS-006 | TC-USERS-009 |
| Expenses | TC-AUTH-011, TC-EXP-008 | TC-EXP-009 |
| Settings | TC-SETTINGS-006 | TC-SETTINGS-012 |

URL-block coverage for Owner-restricted/Manager-restricted modules is solid.

---

## Findings

### CRITICAL

[CRITICAL] No API-level/backend RBAC tests — Evidence: All negative RBAC TCs (TC-AUTH-010/011/013, TC-EXP-008/009, TC-USERS-006/009, TC-SETTINGS-006/012, TC-ANALYTICS-006) verify only UI redirect. None verify that a forbidden role calling the API endpoint directly (e.g. `POST /api/expenses` with Manager session) is rejected with 403. UI redirect ≠ authorization. A Manager could craft a request bypassing client-side guard and the test suite would not catch it. Recommendation: Add TC-AUTH-016..022 — for each Owner-only and Owner/Manager-only module, verify backend returns 403/401 to forbidden roles regardless of UI.

[CRITICAL] No data-level/cross-tenant RBAC tests — Evidence: Test suite has zero TCs for object-level authorization (e.g., can a Manager edit a record created by Owner? can Staff view another staff's chat thread? can Staff record payment that is hidden from them in finance?). User stories don't explicitly call this out, but it's standard OWASP A01. Recommendation: Clarify with PO whether data-level isolation is required, then add TCs (or document explicitly that object-level RBAC is N/A for v1).

### IMPORTANT

[IMPORTANT] No positive sidebar-visibility test for Owner — Evidence: US-AUTH-003 implies Owner sees ALL items but no TC verifies it. TC-AUTH-008/009 only test Staff/Manager sidebar. Recommendation: Add TC-AUTH-016 "Owner sidebar shows all 13 modules".

[IMPORTANT] Manager sidebar hidden — Users & Settings missing — Evidence: TC-AUTH-009 verifies Manager hides "Chi phí" and shows "Báo cáo", but does not verify Users and Settings are hidden in Manager sidebar. US-AUTH-003 explicitly states "Manager không thấy Users, Expenses, Settings". Recommendation: Extend TC-AUTH-009 or add TC-AUTH-017 covering Manager sidebar Users + Settings hidden.

[IMPORTANT] Staff sidebar hidden — Expenses, Analytics, Settings missing explicit assertion — Evidence: TC-AUTH-008 covers only "Nhân sự" (Users). US-AUTH-003 lists 4 hidden items for Staff (Users, Expenses, Analytics, Settings). Only Users is asserted in sidebar. Recommendation: Extend TC-AUTH-008 to assert all 4 items hidden, or add TC-AUTH-018.

[IMPORTANT] No positive role tests for shared modules (Categories, Orders, Customers, Suppliers, Supplier Orders, Chat) — Evidence: 6 modules accessible to all 3 roles have zero role-tagged positive TCs. Only Products (TC-PROD-019 Staff) and Debts (TC-DEBT-009 Staff, TC-DEBT-010 Manager) are explicitly verified. A regression where e.g. Staff loses /chat access would not be caught. Recommendation: Add a role-parameterized smoke TC matrix: TC-RBAC-SMOKE-001..N "Role X can GET /<module>" for each (role, allowed-module) cell. Or add inline role-check TCs to each module section (cheap: 1 TC per module).

[IMPORTANT] Owner positive access for Analytics not explicit — Evidence: TC-ANALYTICS-001 prerequisite says "Owner/Manager logged in" but doesn't split. No standalone "Owner can access /analytics" TC. Manager has TC-AUTH-012 but Owner has none. Recommendation: Split TC-ANALYTICS-001 or add TC-AUTH-019 "Owner can access /analytics".

### MODERATE

[MODERATE] Duplicate negative TCs for /users and /expenses — Evidence: TC-AUTH-010 ≈ TC-USERS-006 (Staff blocked from /users), TC-AUTH-011 ≈ TC-EXP-008 (Staff blocked from /expenses). Redundant. Recommendation: Consolidate; keep AUTH-section as canonical RBAC suite, remove dupes from module sections.

[MODERATE] No "no error toast / no data leak in error" assertion — Evidence: All redirect TCs say "redirect + error toast" but none asserts the toast/redirect doesn't leak the existence or shape of the forbidden resource. Recommendation: Add assertion to existing redirect TCs: response body / toast must not contain resource details.

[MODERATE] Session/cookie tampering not tested — Evidence: TC-AUTH-014 (timeout) and TC-AUTH-015 (multi-session) exist, but no TC modifies cookie role claim (e.g., Staff cookie tampered to Owner) to verify server re-validates role from DB, not from cookie. Recommendation: Add TC-AUTH-020 "Tampered session role rejected".

[MODERATE] Reset password endpoint RBAC not tested — Evidence: TC-USERS-004 and US-HR-003 are Owner-only by user story, but no TC verifies Manager/Staff cannot trigger reset endpoint. Sensitive operation. Recommendation: Add TC-USERS-010 "Manager/Staff cannot reset user password (API + UI)".

[MODERATE] Customer credential reset (TC-CUST-016) lacks role check — Evidence: US-CUST-004 is Owner/Manager. TC-CUST-016 doesn't specify role; Staff may be able to call reset. Recommendation: Tag TC-CUST-016 as Owner/Manager only and add Staff-negative TC.

[MODERATE] Customer detail page (US-CUST-004) Owner/Manager-only not enforced — Evidence: US-CUST-004 says "Là Owner/Manager" but TC-CUST-011..013 don't restrict by role. Either US-CUST-004 is wrong (Staff also needs detail), or TCs miss Staff-block test. Recommendation: Clarify with PO; add TC if confirmed.

[MODERATE] Customer tier badges (US-CUST-006) Owner/Manager-only not enforced — Evidence: US-CUST-006 says "Là Owner/Manager" but TC-CUST-015 doesn't restrict. Same ambiguity as above.

[MODERATE] Debt report detail (US-DEBT-003) Owner/Manager-only not enforced — Evidence: US-DEBT-003 specifies Owner/Manager but TC-DEBT-008 has no role restriction; TC-DEBT-009 explicitly grants Staff to /debts list. Inconsistency between list (all roles) and detail (Owner/Manager). Recommendation: Clarify; add Staff-negative TC for debt detail if scope confirmed.

[MODERATE] Finance analytics (US-DASH-003) Owner-only not enforced — Evidence: US-DASH-003 says "Là Owner" but TC-ANALYTICS-003 prereq says "Owner logged in" without testing Manager exclusion from Finance sub-tab. If Finance is Owner-only within Analytics (Manager allowed), need explicit Manager-block test. Recommendation: Clarify scope; if Finance is Owner-only, add TC for Manager seeing Analytics but Finance tab hidden/blocked.

### Stats

- Modules covered: 13
- Total matrix cells (positive + applicable negative): 13 modules × 6 cells = 78; relevant cells (excluding N/A) = ~30
- MISSING cells: 16 of ~30 (~53% gap), driven by absence of positive role tests on shared modules
- Most-covered: Users, Expenses, Settings (Owner-only) — solid +/− coverage
- Least-covered: Categories, Orders, Customers, Suppliers, Supplier Orders, Chat — zero explicit role tests
- API-level RBAC tests: 0 (CRITICAL gap)

---

## Unresolved Questions

1. Is API-level RBAC in scope for this test suite, or is the team relying on UI-only checks? (drives CRITICAL severity)
2. US-CUST-004, US-CUST-006, US-DEBT-003, US-DASH-003 are tagged Owner/Manager only — is this intentional or stale? Inconsistency with module-level "all 3 roles can access /customers" makes detail-page restriction ambiguous.
3. Is data-level RBAC (object ownership, cross-staff isolation) required for v1, or accepted as v2 scope?
4. Should sidebar visibility tests be one consolidated parameterized TC per role, or per-module (current pattern)?
5. Inventory analytics (TC-ANALYTICS-005) — Manager allowed? US-DASH-002 implies yes, but no TC.
