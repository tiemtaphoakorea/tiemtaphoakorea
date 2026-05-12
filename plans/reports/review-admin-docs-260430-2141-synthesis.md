---
type: synthesis
reviewers: reviewer-1 (coverage), reviewer-2 (quality), reviewer-3 (rbac), reviewer-4 (error-handling)
date: 2026-04-30
status: complete
---

# Team Review Synthesis — admin-user-stories & admin-test-cases

**Scope:** `docs/admin-user-stories.md` (28 US, ~95 ACs) + `docs/admin-test-cases.md` (185 TCs, 15 sections)

**Team:** 4 reviewers chạy song song — coverage, quality, RBAC, error handling

---

## Executive Summary

| Reviewer | Focus | Issues | Critical |
|----------|-------|--------|---------|
| reviewer-1 | Coverage | 22 gaps + orphans | 5 |
| reviewer-2 | Quality | 60 issues | 7 |
| reviewer-3 | RBAC | 16 missing cells | 2 |
| reviewer-4 | Error handling | ~55 gaps | 4 |
| **Total** | | **~143 distinct findings** | **18** |

**Applied fixes in this session:** critical ambiguities, error display standardization, missing TCs for confirmed features, orphan TC → US AC additions.

**Blocked on PO decision:** 14 business rules (see Section 5).

---

## 1. CRITICAL Findings (18 total — all must fix before implementation)

### 1a. Ambiguous Expected Results (block testability)

| TC | Problem | Fix Applied |
|----|---------|-------------|
| TC-AUTH-004/005 | `"Validation error or disabled button"` | → `"Submit button disabled"` |
| TC-PROD-024 | `"Error toast hoặc inline"` | → inline under upload field |
| TC-ORD-021 | `"Form locked or error"` | → fields disabled + specific error |
| TC-ORD-024 | `"Error toast hoặc inline"` | → inline banner on form |
| TC-ERROR-005 | `"Last write wins (or conflict warning)"` | blocked on PO decision |
| TC-SUPP-ORD-012 | `"ẩn hoặc disabled"` | → disabled with tooltip |

### 1b. Coverage Gaps (confirmed features with no TC)

| Gap | Fix Applied |
|-----|-------------|
| Dashboard day-over-day comparison | Added TC-DASH-009 |
| Order fulfillment filter — 3 missing statuses | Added TC-ORD-027/028/029 |
| Settings — delete tier | Added TC-SETTINGS-013 |
| HR — force password change on first login | Added TC-USERS-010 |
| Search debounce — Product | Note added to TC-PROD-002 |

### 1c. RBAC Critical Gaps

| Gap | Status |
|-----|--------|
| No API-level RBAC tests | Blocked on infra decision |
| No data-level RBAC tests | Blocked on scope decision |

### 1d. Business Rule Edge Cases (undefined)

| Rule | Status |
|------|--------|
| Customer hard-delete behavior | Blocked on PO |
| Cancel order Delivered (return flow) | Blocked on PO |
| Order edited to 0 items | Blocked on PO |
| Payment rounding (partial × N = 0.01 dư) | Blocked on PO |

---

## 2. IMPORTANT Findings Summary

### Coverage (reviewer-1)
- Sidebar matrix AC not fully tested (Manager missing Users+Settings; Staff missing Expenses/Analytics/Settings) → TC-AUTH-009 extended
- Category reparent (chuyển parent) uncovered → TC-CAT-009 added
- Fulfillment status history: timestamp + actor not asserted → TC-ORD-014 extended
- Payment method + note not asserted → TC-ORD-012 extended  
- Customer retail filter missing → TC-CUST-021 added
- Banner edit + delete missing → TC-SETTINGS-014/015 added
- Banner position + status fields missing → TC-SETTINGS-004 extended
- Debt payment timeline not asserted → TC-DEBT-008 extended

### Quality (reviewer-2)
- 12 TCs với vague seed data ("X exists") — no quantity → needs `qa-fixtures.md` (blocked)
- TC-AUTH-015 mislabeled ("multi-session" is actually fresh login) → title fixed
- TC-ORD-018 stock-restore downgraded P2 → should P1 (data integrity) → updated
- TC-SUPP-ORD-008 stock-increment → P1 (mirrors cancel) → updated
- TC-AUTH-014 session timeout P3 → P2 (security control) → updated
- Error location standard (inline/toast/dialog) applied retroactively to older TCs

### RBAC (reviewer-3)
- Owner sidebar — no explicit TC → TC-AUTH-016 added
- Manager sidebar — Users + Settings hidden not asserted → TC-AUTH-009 extended
- Staff sidebar — only Users hidden asserted; Expenses/Analytics/Settings missing → TC-AUTH-008 extended  
- Shared modules (Categories, Orders, Customers, Suppliers, Supplier Orders, Chat) have 0 role-tagged positive TCs → TC-RBAC-SMOKE added (1 TC per shared module × 3 roles)
- Customer detail page / tier badges / debt detail — Owner/Manager only per US but no Staff-block TC → added

### Error Handling (reviewer-4)
- 7+ redirect TCs don't say what toast message says → standardized to "Bạn không có quyền truy cập trang này"
- Error WHERE missing for: TC-AUTH-002/003, TC-PROD-006, TC-CUST-007/008/017, TC-CAT-005/007 → added
- No TC for inline error clearing when user corrects field → TC-ERROR-011 added
- No TC for form data preserved after failed submit → TC-ERROR-012 added
- Optimistic UI rollback (status update fails) → TC-ERROR-013 added
- Business rules needing PO decision (see Section 5)

---

## 3. MODERATE Summary (applied retroactively)

- TC-AUTH-007: "back button" → "browser back button"
- TC-PROD-019: removed "(role check)" parenthetical
- TC-EXP-003: casing normalized → Vận chuyển, Khác
- TC-CHAT-005: extended to whitespace-only also disabled
- TC-ERROR-010: "mobile width" → "viewport ≤768px"
- TC-AUTH-001: session cookie assertion made explicit

---

## 4. Orphan TCs → ACs Added to User Stories

These TCs existed with no corresponding AC. Added explicit ACs:

| TC | New AC location |
|----|----------------|
| TC-AUTH-014 (session timeout) | US-AUTH-002 |
| TC-AUTH-015 (fresh login replaces session) | US-AUTH-002 |
| TC-SUPP-008/010 (supplier delete) | US-SUPP-002 |
| TC-ORD-021 (delivered order immutable) | US-ORD-004 |
| TC-PROD-018 (duplicate name allowed) | US-PROD-002 |
| TC-ERROR-001..010 section | New US-CROSS-001 added |

---

## 5. Unresolved Questions (blocked — need PO decision before TC)

| # | Question | Impact |
|---|----------|--------|
| 1 | Customer có hard-delete hay chỉ activate/deactivate? | TC-CUST delete flow |
| 2 | Cancel đơn Delivered cho phép không? Flow = return hay cancel? | TC-ORD-027 spec |
| 3 | Order edit về 0 items: auto-cancel hay block? | TC-ORD-024 extension |
| 4 | Payment rounding rule: round up/down/banker's? | TC-DEBT partial calc |
| 5 | Tier boundary: min_spend inclusive (≥) hay exclusive (>)? | TC-CUST-015 spec |
| 6 | Customer total_spent giảm khi cancel/refund? → tier downgrade? | TC-CUST tier flow |
| 7 | Concurrent edit: last-write-wins hay optimistic locking (409)? | TC-ERROR-005 |
| 8 | Session expired mid-form: draft localStorage hay mất data? | TC-ERROR-003 extension |
| 9 | Update user role → ảnh hưởng active session (force re-login)? | TC-USERS edge case |
| 10 | Last Owner protection (không thể self-demote / deactivate cuối)? | TC-USERS-007 |
| 11 | API-level RBAC tests trong scope test suite này không? | TC-AUTH-016..022 |
| 12 | Variant history: ghi price hay cost? (US says price, TC tests cost) | TC-PROD-017 |
| 13 | Customer credential reset: same as HR (8-char + force change)? | TC-CUST-016 |
| 14 | Supplier order Delivered cancel: rollback stock? | TC-SUPP-ORD flow |

---

## 6. Recommendations (cross-cutting)

1. **Create `docs/035-QA/qa-fixtures.md`** — named seed datasets for TCs to reference. High ROI: resolves 12+ "X exists" preconditions.
2. **Adopt error display standard in TC template**: `inline-field-error | toast | dialog-error | full-page-error` + WHERE + WHAT + WHEN clears.
3. **Add security smoke section** (min 3 TCs): XSS in text fields, SQLi in search, file magic bytes.
4. **RBAC positive smoke matrix** — 1 TC per (allowed-role × shared-module) = ~18 TCs, ensures no regression.
5. **Concurrent stock / payment race condition** TCs — at minimum document as known gap until load testing.

---

## 7. Source Reports

- `/plans/reports/reviewer-1-260430-2141-coverage.md`
- `/plans/reports/reviewer-2-260430-2141-quality.md`
- `/plans/reports/reviewer-3-260430-2141-rbac.md`
- `/plans/reports/reviewer-4-260430-2141-error-handling.md`
