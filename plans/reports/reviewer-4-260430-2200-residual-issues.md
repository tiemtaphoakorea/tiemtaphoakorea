# Reviewer-4 — Residual Issues & Global Consistency

**Scope:** verification pass on `docs/admin-user-stories.md` + `docs/admin-test-cases.md` after first review cycle.
**Totals verified:** 206 TCs, 44 USs. Section headers 1–15 sequential. Per-section counts in headers match actual rows.

---

## CRITICAL

### C1. Only 1 of 14 PO-blocked items is documented
Lead's checklist names 14 items needing "blocked on PO" / "TBD" annotation. Only TC-ERROR-005 carries that note. The other 13 are silently absent.

| # | Topic from lead checklist | Where it should live | Current state |
|---|---------------------------|----------------------|---------------|
| 1 | Customer hard-delete | TC-CUST-014 (only Activate/Deactivate exists) | No TC for hard-delete; not noted as blocked |
| 2 | Cancel order when status=Delivered | Orders section (TC-ORD-021 covers "cannot modify" but not cancel) | Silent — no TC + no TBD note |
| 3 | Cancel order rolling to 0 items | Near TC-ORD-024 | Silent |
| 4 | Payment rounding rule | TC-ORD-012/013 or TC-DEBT-005 | Silent |
| 5 | Tier boundary inclusive/exclusive | TC-CUST-015 / TC-SETTINGS-007 | Silent (TC-SETTINGS-007 uses "no longer meets" wording but doesn't define ≥ vs >) |
| 6 | Customer total_spent on cancel/refund | TC-ORD-018 (cancel restores stock) | Silent — does cancel reverse total_spent? |
| 7 | Session expired mid-form draft | TC-ERROR-003 (says "Redirect to login") | Silent on draft preservation across re-login |
| 8 | Update user role → active session impact | TC-USERS section | No TC at all |
| 9 | Last Owner protection (cannot delete/demote last Owner) | TC-USERS section | No TC at all |
| 10 | API-level RBAC scope (vs UI-only checks) | TC-AUTH-010/011/013 (UI-redirect only) | Silent on API enforcement |
| 11 | Variant history: tracks price OR cost? | TC-PROD-011 says "variant history recorded"; TC-PROD-017 says "Old Cost / New Cost"; TC-PROD-021 says "variant price" | Inconsistent — TC-PROD-017 implies cost-only; US-PROD-005 says "cost, price changes" |
| 12 | Customer credential reset spec | TC-CUST-016 ("New credentials generated/sent, dialog shows details") | Vague — unlike TC-USERS-004 which is specific (8-char temp). No TBD note |
| 13 | Supplier order Delivered cancel rollback | TC-SUPP-ORD-011/012 | Covers cancel for Pending only; doesn't note Delivered-rollback as blocked |

**Recommendation:** add a "Pending PO Decision" subsection at the end of admin-test-cases.md listing all 13, OR add inline `(TBD — blocked on PO decision)` notes on the relevant TCs (mirror TC-ERROR-005's pattern).

### C2. TC-PROD-011 vs TC-PROD-017 vs TC-PROD-021 — variant history scope conflict
- TC-PROD-011 (line 70): "Price updated, variant history recorded"
- TC-PROD-017 (line 76): variant history table headers are `Old Cost, New Cost, Changed By` — no price column
- TC-PROD-021 (line 80): "Edit variant price → view variant history → name shown"

If history tracks BOTH price and cost, TC-PROD-017's table headers are wrong. If only cost, TC-PROD-011 + TC-PROD-021 are wrong. **This is also item 11 of C1** — but flagged separately because the conflict exists *within the test cases themselves*, not just an unanswered PO question.
**Recommendation:** unify TC-PROD-017 column list to include both Old/New Price AND Old/New Cost, or add TBD note.

---

## IMPORTANT

### I1. RBAC redirect TCs — inconsistent expected-result wording
Three different forms used for the same RBAC-redirect outcome:

| Form | Used in |
|------|---------|
| `Redirect to dashboard + error` (vague) | TC-EXP-008, TC-ANALYTICS-006, TC-USERS-006, TC-SETTINGS-006 (4 TCs) |
| `Redirect to dashboard + error toast` (slightly better, no msg text) | TC-EXP-009, TC-USERS-009, TC-SETTINGS-012 (3 TCs) |
| `Redirect về dashboard; toast "Bạn không có quyền truy cập trang này"` (specific) | TC-AUTH-010, TC-AUTH-011, TC-AUTH-013 (3 TCs) |

**Recommendation:** rewrite all 7 vague entries (lines 234, 235, 249, 264, 267, 281, 287) to match the AUTH form with the exact toast text. US-CROSS-001 already mandates this exact toast — TCs should reflect it.

### I2. Four TCs still use bare "Error \"...\"" without channel/location
Lines 176, 196, 230, 231, 263, 319 — expected result is just `Error "..."`. No specification of inline-vs-toast, where it appears, what colour, or whether form blocks. Inconsistent with the pattern established elsewhere (`Inline error dưới field X: "..."` or `Toast error: "..."`).

| Line | TC | Current | Should be |
|------|----|---------| ---------|
| 176 | TC-SUPP-006 | `Error "Email không hợp lệ"` | `Inline error dưới field email: "Email không hợp lệ"` |
| 196 | TC-SUPP-ORD-009 | `Error "Phải có ít nhất 1 sản phẩm"` | `Inline banner trên form: "..."` (mirror TC-ORD-024) |
| 230 | TC-EXP-004 | `Error "Số tiền bắt buộc"` | `Inline error dưới field số tiền: "..."` |
| 231 | TC-EXP-005 | `Error "Số tiền phải > 0"` | `Inline error dưới field số tiền: "..."` |
| 263 | TC-USERS-005 | `Error "Username đã tồn tại"` | `Inline error dưới field username: "..."` |
| 319 | TC-ERROR-008 | `Error "File quá lớn, max 10MB"` | `Inline error dưới upload field: "..."` |

### I3. Six TCs still contain ambiguous "hoặc" / "or"
- Line 22 TC-AUTH-002, line 23 TC-AUTH-003: error text `"Tên đăng nhập hoặc mật khẩu không chính xác"` — this is **acceptable** because the "or" is part of the verbatim user-facing error message, not an ambiguous expected-result branch. **No fix needed**, but worth noting it appeared in scan.
- Line 52 TC-DASH-009: `"+12% so với hôm qua" hoặc "-5 đơn"` — these are example formats; "or" is enumerative. **Acceptable.**
- Line 83 TC-PROD-024: `Upload file .pdf hoặc .txt` — step description listing two test inputs. **Acceptable.**
- Line 161 TC-CUST-019: `"abc123" hoặc số ít hơn 10 chữ số` — step listing two invalid-input cases. **Acceptable** but consider splitting into two TCs for clarity since they exercise different validation rules (non-numeric vs length).
- Line 251 TC-ANALYTICS-008: expected text `"Không có dữ liệu cho khoảng thời gian này" thay vì lỗi hoặc 0` — the "lỗi hoặc 0" describes anti-patterns, not branches. **Acceptable.**

**Conclusion:** all surviving "hoặc" instances are descriptive/enumerative, not ambiguous expected-result branches. **No blocker.** Only TC-CUST-019 is worth splitting into TC-CUST-019a (non-numeric) + TC-CUST-019b (too short) for cleaner pass/fail.

### I4. Vague preconditions still present (>15 instances)
Spot-check found "User logged in", "Customer exists", "Order exists", "Product exists" used as the entire precondition. These don't say which role, which DB state (e.g., paid vs unpaid), or which fields populated. Examples:
- TC-DASH-001 line 44: `User logged in` → which role?
- TC-PROD-010..014 lines 69-73: `Product exists` → with orders? variants? images?
- TC-ORD-009 line 115: `Order exists` → which payment/fulfillment status?
- TC-CUST-010 line 152: `Customer exists` → active or inactive?

Earlier review cycle improved many but didn't sweep the basic CRUD TCs. **Not blocking** — these are happy-path TCs where the gap is tolerable, but a 30-min sweep would tighten them.

### I5. TC-CUST-016 expected result vague
Line 158: `New credentials generated/sent, dialog shows details` — does NOT say:
- Is it a temp password (like TC-USERS-004's 8-char) or a reset link?
- "Sent" how — email, SMS, displayed?
- Does customer also force-change on next login (mirror TC-USERS-010)?

**Recommendation:** either spec it concretely or mark `(TBD — blocked on PO decision per item 12)`.

---

## MODERATE

### M1. TC-CUST-014 expected result has typo
Line 156: `Customer status → inactive, can see in UI` — "can see in UI" is unclear. Probably meant "change visible in UI" or "status badge updates to Inactive in list".

### M2. TC-ORD-027 isn't about cancel — but the lead's checklist referenced it
Lead's checklist said "Cancel order Delivered (TC-ORD-027 note?)" — TC-ORD-027 is actually a fulfillment-status filter. There's NO TC covering "attempt to cancel a Delivered order". TC-ORD-021 only covers edit/status-change disable, not cancel-button state. **Gap:** add a TC for "Cancel button disabled/hidden when order=Delivered" or note as TBD.

### M3. TC-ANALYTICS-008 placement
Section 11 has 8 TCs ending at TC-ANALYTICS-008 — analytics-008 (empty state) is good but `Date range có 0 giao dịch` is mixed Vietnamese/English nomenclature ("có 0 giao dịch"); minor but noticeable.

### M4. Summary section "Coverage by Module" priority sums
Spot-check: Orders entry says `(P1: 5, P2: 21, P3: 3)` = 29 ✓.
Customers entry says `(P1: 2, P2: 18, P3: 1)` = 21 ✓.
Settings entry says `(P1: 2, P2: 12, P3: 1)` = 15 ✓.
Counts add up. **No issue.**

### M5. US-CROSS-001 is well-formed and complete
ACs cover: validation inline, network/server toast+retry, inline-clear on correct, form-data preservation on 500, optimistic rollback, RBAC redirect toast text, mobile sidebar collapse. All 7 ACs map to TCs in section 15 + scattered TCs. **Good shape.** Only nit: AC "Lỗi network/server hiển thị toast đỏ" — TC-ERROR-001 just says `Error toast "Mất kết nối"`, doesn't specify red colour or retry button. Minor drift between US and TC.

### M6. Newly introduced section 15 — TC-ERROR-013 strong, but "API returns 500" assumption
Line 324 TC-ERROR-013: tests optimistic rollback on 500. What about 4xx (validation), 409 (conflict), network drop? Single error class tested. Not a blocker — it's a representative case — but consider whether more network-error TCs warrant duplicating this pattern.

---

## What's working

- Section numbering 1–15 sequential, no gaps.
- Section header counts match actual TC counts in every section.
- Total 206 in Summary matches actual table count.
- All 44 USs have role tags ("**Là** một X").
- US-CROSS-001 is complete and consistent with section 15 TCs.
- All "Inline error" patterns are uniform: `Inline error dưới field X: "msg"; form không submit`.
- Confirmation-dialog pattern uniform across delete TCs.
- Verbatim user-facing error strings preserved in Vietnamese without contamination.

---

## Unresolved questions

1. Should the 13 PO-blocked items become real TCs with `(TBD)` notes, or be moved to a new "Pending Decisions" appendix? Lead to choose format.
2. Variant history scope (C2): is this a real product spec gap or just doc inconsistency? Need PO/dev confirmation before fixing TC-PROD-017.
3. Should TC-CUST-019 be split into two TCs (non-numeric vs length)?
4. Should there be parity TCs for HR (Last Owner protection, role-change session impact)? Currently zero coverage.
5. Should section 15 cover more error classes (4xx, 409 conflict) beyond just 500/network?

**Status:** DONE
**Summary:** Verification pass found 2 critical issues (PO-blocked items mostly undocumented; variant history scope conflict), 5 important consistency gaps (RBAC redirect wording, bare "Error" strings, vague preconditions, TC-CUST-016 spec, gap on cancel-Delivered), 6 moderate items. Totals + section counts + role tags verified clean.
