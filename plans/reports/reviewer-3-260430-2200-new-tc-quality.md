---
id: REVIEWER-3-NEW-TC-QUALITY
type: review-report
date: 2026-04-30
reviewer: reviewer-3
focus: New TC Quality
scope: 14 new + 5 extended TCs in docs/admin-test-cases.md
---

# Review — New TC Quality

Scope: 14 new TCs (TC-AUTH-016, TC-DASH-009, TC-CAT-009, TC-ORD-027/028/029, TC-CUST-021, TC-USERS-010, TC-SETTINGS-013/014/015, TC-ERROR-011/012/013) + 5 extended (TC-ORD-012, TC-ORD-014, TC-DEBT-008, TC-SETTINGS-004, TC-CHAT-005).

Note: lead listed 21 new TCs but only 14 are actually new in current doc (file shows 206 total; some may have been pre-existing or numbered differently). Reviewed all 14 new + 5 extended I could locate.

---

## Findings

### TC-AUTH-016 — Owner sees all 13 modules

[MODERATE] Module count mismatch — table lists 13 named modules but Settings page also implies "Categories" and the spec sidebar may include more — evidence: expected lists 13 items; "Dashboard, Products, Categories, Orders, Customers, Suppliers, Supplier Orders, Debts, Chat, Analytics, Expenses, Users, Settings" = exactly 13, OK — recommendation: confirm against `Spec-RBAC-Matrix.md` that no module is missing (e.g., no separate "Reports"); add explicit assertion "no extra items beyond these 13".

[MODERATE] Order not asserted — recommendation: add expected order or note "order not enforced" to avoid ambiguous failures.

Verdict: **PASS** (with note to verify list against RBAC spec).

---

### TC-DASH-009 — KPI day-over-day comparison

[IMPORTANT] Ambiguous expected — "+12% so với hôm qua" is example, not deterministic — evidence: expected uses "e.g.," — recommendation: tighten to "Each KPI card displays a delta vs yesterday: percent (revenue/AOV) and absolute count (orders); sign indicator (+/-) and color (green up / red down)".

[MODERATE] Missing edge cases — yesterday=0 (division by zero), no data yesterday — recommendation: add sub-cases or note expected behavior ("show '—' or 'N/A' when yesterday=0").

Verdict: **NEEDS-FIX**.

---

### TC-CAT-009 — Reparent category

[MODERATE] Missing nesting depth check — what if reparent creates cycle (A→B→A)? — recommendation: add negative TC TC-CAT-010 "Cannot reparent to own descendant" (cycle prevention).

[MODERATE] Product migration unclear — when category reparents, do products under "Con A" stay associated? — recommendation: add "Products under 'Con A' remain associated with 'Con A'; product count under 'Cha Y' increases by Con A's count".

Verdict: **NEEDS-EXTENSION**.

---

### TC-ORD-027 / 028 / 029 — Filter by fulfillment status

[MODERATE] Three near-identical TCs add little — DRY violation; one parameterized TC could cover all statuses — evidence: TC-ORD-027/028/029 differ only in status value — recommendation: consolidate into single TC with parameter table (status: Pending/Confirmed/Shipped/Delivered/Cancelled), or keep all 5 statuses for full coverage (currently missing Shipped & Cancelled).

[IMPORTANT] Missing statuses — Shipped, Cancelled — evidence: TC-ORD-007 covers Shipped generally; TC-ORD-027-029 introduce per-status pattern but skip Shipped & Cancelled — recommendation: add TC-ORD-030 (Shipped) and TC-ORD-031 (Cancelled) for symmetry, OR remove redundant ones and parameterize.

Verdict: **NEEDS-EXTENSION**.

---

### TC-CUST-021 — Filter customer type Retail

[MODERATE] Symmetric to TC-CUST-005 (Wholesale) — fine, but precondition "Wholesale & retail customers exist" should specify count (e.g., ≥2 each) to validate filter actually filters, not just shows accidentally — recommendation: "DB has ≥2 Wholesale and ≥2 Retail customers; after filter, only Retail rows visible, count matches".

Verdict: **PASS**.

---

### TC-USERS-010 — Force password change on first login

[IMPORTANT] No assertion that staff CANNOT bypass — evidence: expected says "dialog hiển thị" but doesn't assert dialog is non-dismissible or that API calls are blocked — recommendation: add "Cancel/X button absent or disabled; navigation to other routes redirects back to dialog; API requests return 403 until password changed".

[IMPORTANT] No assertion on temp-password expiry — recommendation: add "After successful new-password set, dialog dismisses; subsequent logins do NOT re-prompt".

[MODERATE] No negative case — what if staff submits same temp password as new password? — recommendation: add TC-USERS-011 "Cannot reuse temp password as new password".

Verdict: **NEEDS-FIX**.

---

### TC-SETTINGS-013 — Delete customer tier

[CRITICAL] Tier with assigned customers — precondition says "no customers at that tier" but expected says "customers previously at that tier không còn badge đó" — contradiction — evidence: precondition rules out this case but expected describes it — recommendation: split into two TCs: (a) delete tier with no customers (clean delete), (b) delete tier with customers assigned (either blocked, or customers downgraded to next-lowest tier — must be specified).

[IMPORTANT] No confirm dialog asserted — recommendation: add "Confirm dialog appears with 'Bạn có chắc...?'; clicking Cancel keeps tier".

Verdict: **NEEDS-FIX**.

---

### TC-SETTINGS-014 — Edit banner update title and URL

[MODERATE] Doesn't cover image replacement — only title+URL — recommendation: add coverage or split: TC-SETTINGS-014a (text fields), TC-SETTINGS-014b (replace image).

[MODERATE] URL validation not asserted — invalid URL ("notaurl") behavior unclear — recommendation: add inline error assertion or separate negative TC.

Verdict: **NEEDS-EXTENSION**.

---

### TC-SETTINGS-015 — Delete banner

[MODERATE] No confirm dialog assertion — recommendation: add "Confirm dialog with banner title; Cancel preserves banner".

[MODERATE] No assertion banner removed from public storefront — recommendation: add "Banner no longer appears in storefront homepage" if scope includes that integration.

Verdict: **PASS** (minor gaps).

---

### TC-ERROR-011 — Inline error clears on correct

[MODERATE] "Move focus" trigger ambiguous — onBlur or onChange? — evidence: "move focus" implies onBlur but "ngay khi field value hợp lệ" implies onChange — recommendation: pick one: "Inline error clears on `onChange` as soon as value becomes valid (no blur required)".

Verdict: **NEEDS-FIX**.

---

### TC-ERROR-012 — Form data preserved after 500

[IMPORTANT] Doesn't specify which forms — global behavior or specific form? — evidence: "Form filled với dữ liệu đầy đủ" generic — recommendation: pick representative form (e.g., Add Product) and explicitly list all fields preserved; consider applying to all critical forms via separate parameterized TCs.

[MODERATE] File upload field behavior unclear — file inputs typically can't preserve selection across re-render — recommendation: add caveat "File inputs may require re-selection; toast warns user if files were lost".

Verdict: **NEEDS-FIX**.

---

### TC-ERROR-013 — Optimistic UI rollback

[IMPORTANT] No timing/race spec — what if user clicks again during rollback? — recommendation: add "Dropdown disabled during in-flight request; re-enabled after rollback".

[MODERATE] Missing positive counterpart — TC for "optimistic update succeeds, no rollback" — evidence: this TC tests failure path; no TC validates the optimistic happy path explicitly — recommendation: add TC-ERROR-014 or fold into TC-ORD-014 ("optimistic update commits on 200, no flicker").

Verdict: **PASS** (with extensions recommended).

---

## Extended TCs

### TC-ORD-012 (extended — payment method + note)

[MODERATE] "note (optional)" — if optional, what if user provides note? Need explicit assertion both with and without note — recommendation: add "If note provided: appears in history; if omitted: history shows '—' or no note line".

Verdict: **PASS**.

---

### TC-ORD-014 (extended — timestamp + actor)

[MODERATE] Timestamp format not specified — "timestamp chính xác" ambiguous — evidence: needs format like "DD/MM/YYYY HH:mm" or relative "5 phút trước" — recommendation: specify exact format expected.

[MODERATE] Actor identification — fullName, username, or both? — recommendation: pick one: "actor's fullName displayed".

Verdict: **NEEDS-FIX**.

---

### TC-DEBT-008 (extended — payment timeline)

[MODERATE] Sort order not specified — chronological asc/desc? — recommendation: "Payment timeline sorted descending by date (most recent first)".

[MODERATE] Partial vs full payment differentiation — recommendation: add "Partial payments labeled 'Thanh toán một phần'; full payment labeled 'Tất toán'".

Verdict: **PASS** (minor polish needed).

---

### TC-SETTINGS-004 (extended — position + status)

[IMPORTANT] Position values — "top/middle/bottom" — does the spec match? — evidence: TC introduces these values without reference to spec — recommendation: verify against `Spec-Settings.md` or storefront banner spec; if values differ (e.g., spec uses "header/sidebar/footer"), align.

[MODERATE] Inactive banner behavior — recommendation: add "Inactive banner appears in admin list with grey badge but does NOT show on storefront".

Verdict: **NEEDS-FIX**.

---

### TC-CHAT-005 (extended — whitespace-only disabled)

[MODERATE] "trong cả hai trường hợp" good but missing tab/newline — evidence: only "spaces" tested — recommendation: extend to "spaces, tabs, newlines, mixed whitespace".

Verdict: **PASS**.

---

## Cross-cutting observations

1. **Pattern inconsistency**: Some new TCs use Vietnamese-only expected results, while module patterns mix Vietnamese + English. Acceptable but flag for QA lead.
2. **Priority calibration**: TC-USERS-010 marked P1 (correct — security-critical); TC-CAT-009 P3 (low — but data integrity issue could be P2).
3. **Missing negative pairs**: New positive TCs (TC-CAT-009, TC-SETTINGS-013/014/015) lack matching negative cases (validation, conflict).
4. **Determinism**: Several TCs use "e.g." or hedging language ("hoặc") — replace with deterministic assertions.

---

## Summary verdicts

| TC ID | Verdict |
|-------|---------|
| TC-AUTH-016 | PASS |
| TC-DASH-009 | NEEDS-FIX |
| TC-CAT-009 | NEEDS-EXTENSION |
| TC-ORD-027 | NEEDS-EXTENSION (DRY/coverage) |
| TC-ORD-028 | NEEDS-EXTENSION (DRY/coverage) |
| TC-ORD-029 | NEEDS-EXTENSION (DRY/coverage) |
| TC-CUST-021 | PASS |
| TC-USERS-010 | NEEDS-FIX |
| TC-SETTINGS-013 | NEEDS-FIX (contradiction in precondition vs expected) |
| TC-SETTINGS-014 | NEEDS-EXTENSION |
| TC-SETTINGS-015 | PASS |
| TC-ERROR-011 | NEEDS-FIX (onBlur vs onChange) |
| TC-ERROR-012 | NEEDS-FIX |
| TC-ERROR-013 | PASS |
| TC-ORD-012 (ext) | PASS |
| TC-ORD-014 (ext) | NEEDS-FIX |
| TC-DEBT-008 (ext) | PASS |
| TC-SETTINGS-004 (ext) | NEEDS-FIX |
| TC-CHAT-005 (ext) | PASS |

Counts: PASS=8, NEEDS-FIX=6, NEEDS-EXTENSION=4 (TC-ORD-027/8/9 counted as a single coverage gap effectively).

---

## Top recommendations (priority order)

1. **TC-SETTINGS-013**: resolve precondition/expected contradiction immediately (CRITICAL).
2. **TC-USERS-010**: harden assertions on dialog non-dismissibility and API enforcement (security).
3. **TC-ERROR-011**: pick onBlur or onChange — affects implementation contract.
4. **TC-DASH-009**: replace "e.g." with deterministic delta format; cover yesterday=0.
5. **TC-ORD-027-029**: either parameterize or add Shipped/Cancelled for full coverage.
6. **TC-CAT-009**: add cycle-prevention TC and clarify product migration.
7. **TC-SETTINGS-004**: verify position values against spec.
8. **TC-ERROR-012**: pick representative form; specify file upload caveat.

---

## Unresolved questions

1. Does TC-AUTH-016's "13 modules" list match `Spec-RBAC-Matrix.md` exactly? (Spec not read here.)
2. TC-SETTINGS-013: is the policy "block delete if customers assigned" or "downgrade customers"? Needs PO decision.
3. TC-SETTINGS-004: are banner positions actually top/middle/bottom, or different values per spec?
4. TC-ORD-014: which actor identifier (fullName/username/both) is shown in history per UI spec?
5. TC-ERROR-011: should inline error clear on onChange or onBlur? Affects all forms.
6. TC-ERROR-012: is form-state persistence on 500 a global app behavior or per-form? Implementation pattern (React Hook Form vs uncontrolled) determines feasibility.

**Status:** DONE
**Summary:** Reviewed 14 new + 5 extended TCs. 8 PASS, 6 NEEDS-FIX, 4 NEEDS-EXTENSION. Most critical: TC-SETTINGS-013 contradiction between precondition and expected; TC-USERS-010 missing security-critical assertions.
