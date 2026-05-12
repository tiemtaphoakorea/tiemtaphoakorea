---
type: synthesis
reviewers: reviewer-1 (fix-verification), reviewer-2 (us-tc-consistency), reviewer-3 (new-tc-quality), reviewer-4 (residual-issues)
date: 2026-04-30
status: complete
pass: v2 (verification pass)
---

# Team Review Synthesis v2 — admin-user-stories & admin-test-cases

**Scope:** Verification pass after v1 fixes applied. Current state: 206 TCs, 28 USs (~100 ACs), US-CROSS-001 added.

**Team:** 4 reviewers parallel — fix-verification, US↔TC consistency, new TC quality, residual issues

---

## Executive Summary

| Reviewer | Focus | Issues | Critical |
|----------|-------|--------|---------|
| reviewer-1 | Fix verification | 3 | 0 |
| reviewer-2 | US↔TC consistency | 40 | 2 |
| reviewer-3 | New TC quality | 11 | 1 |
| reviewer-4 | Residual issues | 13 | 2 |
| **Total** | | **~55 distinct** | **5** |

**v1 fix status:** 39/42 items verified-OK. 3 minor issues remain.

**Applied this session:** CRITICAL/IMPORTANT fixes that don't need PO decision.

**Blocked on PO/spec:** 14 items (same 14 as v1 + 5 new spec questions).

---

## 1. CRITICAL Findings (5)

### C1: TC-SETTINGS-013 precondition contradicts expected result
- Precondition: "no customers at that tier"
- Expected: "customers previously at that tier no longer have badge"
- These are mutually exclusive. **Fix applied:** precondition changed to "customers exist at that tier".

### C2: Variant history internal contradiction
- TC-PROD-011: "variant history recorded" on price change
- TC-PROD-017: history table shows `Old Cost, New Cost`
- TC-PROD-021: tests "price change history"
- **Status:** Blocked on spec — US-PROD-005 says "price" but TC-017 tests "cost". Added TBD note to TC-PROD-017.

### C3: 13 of 14 PO-blocked items undocumented
- Only TC-ERROR-005 has "(TBD — blocked on PO)". The other 13 pending decisions are silent.
- **Fix applied:** TBD notes added to relevant TCs. Full list in Section 5.

### C4: TC-AUTH-015 assertion conditional
- Step says "User1 session không còn hợp lệ nếu dùng lại" — not a verified assertion.
- **Fix applied:** added explicit step to attempt User1 cookie and verify 401/redirect.

### C5: US-DEBT-003 vs TC-DEBT-009 role conflict
- US-DEBT-003 says Owner/Manager only; TC-DEBT-009 grants Staff access to /debts.
- **Status:** Blocked on PO — which is correct? Added TBD note to TC-DEBT-009.

---

## 2. IMPORTANT Findings (14 selected)

### Applied this session:
- 7 RBAC redirect TCs (EXP-008/009, ANALYTICS-006, USERS-006/009, SETTINGS-006/012): standardized toast to `"Bạn không có quyền truy cập trang này"`
- 6 bare `Error "..."` TCs (SUPP-006, SUPP-ORD-009, EXP-004/005, USERS-005, ERROR-008): added inline/toast location spec
- US-EXP-001: capitalization fixed "vận chuyển, khác" → "Vận chuyển, Khác"

### Blocked on spec/PO:
- TC-ERROR-011: onBlur vs onChange ambiguity (which trigger clears inline error?) → PO/UX decision
- TC-DASH-009: "e.g." in expected result non-deterministic; yesterday=0 edge case missing → spec needed
- TC-ORD-027/028/029: Shipped + Cancelled filter variants missing → add or accept current scope
- TC-ORD-014 ext: actor ID format (fullName vs username) unspecified → spec needed
- TC-SETTINGS-004 ext: banner position values need spec verification
- TC-USERS-010: API 403 enforcement until password changed; dialog non-dismissability → spec needed
- TC-ERROR-012: no representative form named; file upload caveat → add specificity
- US-DEBT-003 vs DEBT access role → PO decision (see C5)
- TC-CUST-016: doesn't match TC-USERS-004 precision for force-change flow → extend

### Coverage gaps (reviewer-2 — need PO scoping):
- Profit calculation correctness (no TC for US-DASH-003)
- Variant price history scope (US-PROD-005)
- Customer tier upgrade on detail page (US-CUST-006)
- Supplier list stats (US-SUPP-001)
- Supplier order status actor history (US-SUPP-ORD-003)
- Debt payment method + note saved (US-DEBT-002)
- Expense edit/delete (US-EXP-001 — only create covered)
- Activate/deactivate admin user (US-HR-001)
- Chat unread count behavior (US-CHAT-001)
- Customer credential reset force-change (US-CUST-004)
- Manager access to analytics sub-tabs (US-DASH-002)

---

## 3. MODERATE Findings

- ~15 vague preconditions ("User logged in", "Exists in DB") — no seed data spec
- TC-CAT-009: missing cycle-prevention edge case (reparent to own descendant)
- TC-SETTINGS-014/015: missing confirm dialog assertion
- TC-CUST-019: worth splitting 19a (invalid format) / 19b (too short) for precision
- TC-CUST-014: typo in description
- Mixed VN/EN in TC-ANALYTICS-008
- 27 orphan TCs (validation rules, negative cases) with no explicit US AC — document or add to US-CROSS-001

---

## 4. Verified Clean (reviewer-1 + reviewer-4)

- Section headers 1–15 sequential ✓
- All section header counts match row counts (16/9/24/9/29/21/10/14/11/10/8/10/15/7/13) ✓
- Summary total 206 ✓
- Per-section P1/P2/P3 sums correct ✓
- All 44 USs have role tags ✓
- US-CROSS-001 complete and well-formed ✓
- v1 critical ambiguities (TC-AUTH-004/005, PROD-024, ORD-021/024, SUPP-ORD-012) all resolved ✓
- v1 priority changes (ORD-018, SUPP-ORD-008, AUTH-014) all applied ✓
- v1 new TCs (AUTH-016, DASH-009, ORD-027/028/029, CUST-021, CAT-009, SETTINGS-013/014/015, USERS-010, ERROR-011/012/013) present ✓

---

## 5. Pending PO Decisions (19 total — v1 list + new)

| # | Question | Affected TC/US | Added TBD note |
|---|----------|----------------|---------------|
| 1 | Customer hard-delete vs deactivate | TC-CUST-014 | ✓ |
| 2 | Cancel Delivered order (return vs cancel?) | TC-ORD-027 note | ✓ |
| 3 | Order to 0 items: auto-cancel or block | TC-ORD-024 | already noted |
| 4 | Payment rounding rule | TC-DEBT-005/006 | ✓ |
| 5 | Tier boundary inclusive (≥) or exclusive (>) | TC-SETTINGS-007 | ✓ |
| 6 | Customer total_spent on cancel/refund → tier downgrade? | TC-CUST-015 | ✓ |
| 7 | Concurrent edit strategy | TC-ERROR-005 | already noted |
| 8 | Session expired mid-form: draft or data loss | TC-ERROR-003 | ✓ |
| 9 | Update user role → active session force re-login? | TC-USERS edge | ✓ |
| 10 | Last Owner protection | TC-USERS-007 | ✓ |
| 11 | API-level RBAC tests in scope? | TC-AUTH-016..022 | ✓ |
| 12 | Variant history: price or cost? | TC-PROD-017 | ✓ |
| 13 | Customer credential reset: same spec as HR reset? | TC-CUST-016 | ✓ |
| 14 | Supplier order Delivered cancel: rollback stock? | TC-SUPP-ORD flow | ✓ |
| 15 (new) | /debts: Staff allowed or Owner/Manager only? | TC-DEBT-009 vs US-DEBT-003 | ✓ |
| 16 (new) | Inline error trigger: onBlur or onChange? | TC-ERROR-011 | ✓ |
| 17 (new) | Banner position values (top/middle/bottom correct?) | TC-SETTINGS-004 | ✓ |
| 18 (new) | Actor ID in history: fullName or username? | TC-ORD-014 | ✓ |
| 19 (new) | Expense edit/delete in scope for v1? | US-EXP-001 gap | ✓ |

---

## 6. Source Reports

- `plans/reports/reviewer-1-260430-2200-fix-verification.md`
- `plans/reports/reviewer-2-260430-2200-us-tc-consistency.md`
- `plans/reports/reviewer-3-260430-2200-new-tc-quality.md`
- `plans/reports/reviewer-4-260430-2200-residual-issues.md`
