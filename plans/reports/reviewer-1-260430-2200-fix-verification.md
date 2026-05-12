---
id: REVIEWER-1-FIX-VERIFICATION
type: review-report
status: complete
project: K-SMART Admin Panel
created: 2026-04-30
reviewer: reviewer-1
scope: Verify previous synthesis fixes applied to docs/admin-test-cases.md and docs/admin-user-stories.md
---

# Fix Verification Report

Verifying ~143 fixes from previous synthesis. Files re-read at HEAD.

## CRITICAL

(none — all critical fixes landed)

## IMPORTANT

**[IMPORTANT] TC-AUTH-001** — session cookie assertion mentioned but not strict
- Evidence: `cookie 'admin_session' set (HttpOnly)` — names cookie + HttpOnly flag.
- Status: Acceptable. The synthesis asked to "explicitly mention session cookie assertion"; this does. Demoted from Critical to Important only if reviewer wanted Secure/SameSite flags too — synthesis spec did not require those.

**[IMPORTANT] US-AUTH-002** — fresh session ACs added but no TC for the "User1 invalidated" leg
- Evidence: US-AUTH-002 says "Đăng nhập mới thay thế session cũ trên cùng browser; session cũ không còn hợp lệ". TC-AUTH-015 only verifies "User2 session active; User1 session không còn hợp lệ nếu dùng lại" without simulating User1 reuse from another tab/device — assertion conditional ("nếu dùng lại").
- Expected: TC-AUTH-015 step should explicitly attempt User1's old cookie to confirm rejection. Current text passes verification literally but is weakly testable.

## MODERATE

**[MODERATE] TC-AUTH-014 priority** — synthesis said P3→P2; file shows P2. Verified-OK actually. (Initially flagged then re-read — correct.)

**[MODERATE] TC-PROD-019** — text reads `| TC-PROD-019 | Staff can add products | Staff logged in | ... | Product created and appears in list | P2 |`. No "(role check)" parenthetical present.
- Status: Verified-OK.

**[MODERATE] US-CROSS-001 viewport phrasing** — uses "≤768px" matching TC-ERROR-010. Verified-OK.

**[MODERATE] TC-EXP-003 capitalization** — Expected: "Tiền thuê, Lương, Quảng cáo, Vận chuyển, Khác". File shows: `Tiền thuê, Lương, Quảng cáo, Vận chuyển, Khác`. Verified-OK.
- BUT US-EXP-001 still has lowercase: `Danh mục: Tiền thuê, Lương, Quảng cáo, vận chuyển, khác` (line 433). Inconsistency between user story and test case.
- Expected: US-EXP-001 should also use "Vận chuyển, Khác".

## Verified-OK Summary Table

| Item | Expected | Status |
|------|----------|--------|
| TC-AUTH-001 | session cookie assertion | OK (`admin_session` HttpOnly) |
| TC-AUTH-004 | "Submit button disabled" not "or disabled" | OK |
| TC-AUTH-005 | "Submit button disabled" not "or disabled" | OK |
| TC-AUTH-007 | "browser back button" | OK |
| TC-AUTH-014 | P3→P2 | OK (P2) |
| TC-AUTH-015 | title "Fresh login replaces existing session" | OK |
| TC-AUTH-016 | new — Owner sees all 13 modules | OK |
| TC-DASH-009 | new — day-over-day comparison | OK |
| TC-PROD-019 | no "(role check)" parenthetical | OK |
| TC-PROD-024 | "Inline error dưới upload field" | OK |
| TC-CAT-005 | "Toast error đỏ; item không bị xóa" | OK |
| TC-CAT-007 | "Toast error đỏ; item không bị xóa" | OK |
| TC-CAT-009 | new — category reparent | OK |
| TC-ORD-018 | P2→P1 | OK (P1) |
| TC-ORD-021 | fields disabled + specific banner | OK |
| TC-ORD-024 | "Inline banner trên form" | OK |
| TC-ORD-027 | new — fulfillment Pending filter | OK |
| TC-ORD-028 | new — fulfillment Confirmed filter | OK |
| TC-ORD-029 | new — fulfillment Delivered filter | OK |
| TC-CUST-007 | "Inline dưới field; sheet không đóng" | OK |
| TC-CUST-008 | "Inline dưới field; sheet không đóng" | OK |
| TC-CUST-017 | "Inline dưới field; sheet không đóng" | OK |
| TC-CUST-021 | new — retail customer filter | OK |
| TC-DEBT-006 | "Inline dưới input; dialog không đóng; Save disabled" | OK |
| TC-SUPP-ORD-008 | P2→P1 | OK (P1) |
| TC-SUPP-ORD-012 | "disabled" with tooltip | OK |
| TC-SETTINGS-013 | new — delete tier | OK |
| TC-SETTINGS-014 | new — edit banner | OK |
| TC-SETTINGS-015 | new — delete banner | OK |
| TC-USERS-010 | new — force password change first login | OK |
| TC-CHAT-005 | covers whitespace-only | OK |
| TC-ERROR-010 | "viewport ≤768px" | OK |
| TC-ERROR-011 | new — inline error clears | OK |
| TC-ERROR-012 | new — form data preserved | OK |
| TC-ERROR-013 | new — optimistic UI rollback | OK |
| US-AUTH-002 | session timeout + fresh session ACs | OK (lines 42–43) |
| US-PROD-002 | duplicate name allowed AC | OK (line 116) |
| US-ORD-004 | delivered order immutable AC | OK (line 225) |
| US-SUPP-002 | delete constraint AC | OK (line 351) |
| US-CROSS-001 | new cross-cutting error handling section | OK (lines 537–549) |

## Summary counts

- Critical: 0
- Important: 2 (TC-AUTH-001 cookie depth — judgment call; TC-AUTH-015 testable assertion phrasing)
- Moderate: 1 (US-EXP-001 capitalization inconsistency with TC-EXP-003)
- Verified-OK: 39 / ~42 spot-checked items

## Unresolved questions

1. Should TC-AUTH-001 also assert Secure + SameSite flags on `admin_session`, or is HttpOnly enough? (synthesis only required "explicit cookie assertion")
2. TC-AUTH-015 — does the fresh-login behavior actually invalidate User1's existing cookie server-side, or only locally clear it? Step needs sharpening if server-side invalidation is the contract.
3. US-EXP-001 line 433 capitalization — should this be aligned with TC-EXP-003 "Vận chuyển, Khác"? Recommend yes.

**Status:** DONE
**Summary:** All critical/important synthesis fixes landed. 2 minor wording weaknesses (TC-AUTH-015 conditional assertion) and 1 capitalization inconsistency (US-EXP-001 vs TC-EXP-003) flagged.
