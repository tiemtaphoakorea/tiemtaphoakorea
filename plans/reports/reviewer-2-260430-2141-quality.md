---
reviewer: reviewer-2
focus: Quality — TC Clarity & Testability
date: 2026-04-30
---

# Quality Review — admin-test-cases.md

Reviewed: 185 TC across 15 modules. Findings prioritized by impact on testability/reproducibility.

---

## CRITICAL — Ambiguous Expected Results (block test pass/fail decision)

**[CRITICAL] TC-AUTH-004**: Expected result uses "or" — non-deterministic.
- Evidence: `"Validation error or disabled button"`
- Recommendation: Pick one based on actual UI: `"Submit button bị disabled khi username trống; nếu user click submit (qua keyboard), inline error 'Username bắt buộc' hiển thị dưới field"`. Tester cannot decide pass/fail with "or".

**[CRITICAL] TC-AUTH-005**: Same "or" ambiguity as TC-AUTH-004.
- Evidence: `"Validation error or disabled button"`
- Recommendation: Specify exact behavior — disabled button vs inline error.

**[CRITICAL] TC-PROD-024**: Two valid outcomes specified.
- Evidence: `"Error toast hoặc inline: 'Chỉ chấp nhận file ảnh...'"`
- Recommendation: Decide which: `"Inline error dưới upload field..."` OR `"Toast error..."`. Don't accept either.

**[CRITICAL] TC-ORD-024**: Same "toast hoặc inline" ambiguity.
- Evidence: `"Error toast hoặc inline: 'Đơn hàng phải có ít nhất 1 sản phẩm'"`
- Recommendation: Specify exact location.

**[CRITICAL] TC-ORD-021**: Either-or expected result.
- Evidence: `"Form locked or error"`
- Recommendation: Specify: `"Edit button bị ẩn/disabled trên detail page; status dropdown disabled. Nếu force qua URL /orders/[id]/edit, hiển thị lỗi 403 hoặc redirect."`

**[CRITICAL] TC-ERROR-005**: Conflicting outcomes.
- Evidence: `"Last save overwrites previous (or conflict warning)"`
- Recommendation: Two scenarios are not equivalent — last-write-wins vs optimistic locking. Decide and document expected behavior.

**[CRITICAL] TC-SUPP-ORD-012**: "ẩn hoặc disabled" — inconsistent UI states.
- Evidence: `"Nút 'Hủy đơn' bị ẩn hoặc disabled"`
- Recommendation: Pick one. If hidden, no tooltip is testable. If disabled, tooltip required. Suggest: `"Nút bị disabled với tooltip 'Không thể hủy đơn đã xác nhận' khi hover"`.

---

## IMPORTANT — Vague/Unverifiable Expected Results

**[IMPORTANT] TC-DASH-003**: Range "5-10" is not verifiable as specified.
- Evidence: `"Table shows 5-10 recent orders"`
- Recommendation: State the exact specified count (e.g., `"shows 10 most recent orders ordered by created_at DESC"`). Range hides off-by-one bugs.

**[IMPORTANT] TC-AUTH-006**: "if prompted" makes step conditional/unclear.
- Evidence: `"Step 2: Confirm if prompted"`
- Recommendation: Determine actual UX. Either: `"Click logout → redirect immediate (no confirm)"` OR `"Click logout → confirm dialog → click Confirm"`.

**[IMPORTANT] TC-DASH-007**: "Time < 2 seconds" lacks measurement methodology.
- Evidence: `"Time < 2 seconds"`
- Recommendation: Specify: which metric (TTFB / FCP / LCP / TTI), what tool (Lighthouse, Chrome DevTools Performance, k6), what network condition (Fast 3G / cable), warm vs cold cache.

**[IMPORTANT] TC-ERROR-007**: Same — "loads in <2 seconds" without methodology.
- Evidence: `"Each page loads in <2 seconds"`
- Recommendation: Specify metric & condition (e.g., `"Server response < 500ms p95; full page render < 2s on Fast 3G"`).

**[IMPORTANT] TC-CUST-014**: "can see in UI" is not specific.
- Evidence: `"Customer status → inactive, can see in UI"`
- Recommendation: `"Customer row shows inactive badge/grayed-out; status filter 'Inactive' includes them; login as that customer is rejected"`.

**[IMPORTANT] TC-CUST-016**: "generated/sent" — two different flows.
- Evidence: `"New credentials generated/sent, dialog shows details"`
- Recommendation: Pick: dialog-display vs email-send. They have different test verifications.

**[IMPORTANT] TC-ANALYTICS-002**: Vague catch-all.
- Evidence: `"KPIs, charts, recent activities displayed"`
- Recommendation: Enumerate exact widgets: `"Displays cards: Total Revenue (today), Order Count (today), Customers count, Top Products chart, Recent Orders table (latest 10)"`.

**[IMPORTANT] TC-ANALYTICS-005**: "low-stock alerts, turnover shown" — undefined thresholds.
- Evidence: `"Stock levels, low-stock alerts, turnover shown"`
- Recommendation: Define low-stock threshold (e.g., qty < 10) and turnover formula in TC or reference spec.

**[IMPORTANT] TC-CHAT-006**: "Earlier messages displayed" — unclear pagination.
- Evidence: `"Earlier messages displayed"`
- Recommendation: `"On scroll-to-top, fetch + prepend N older messages (N=20); loading spinner shows during fetch; no scroll jump after prepend"`.

**[IMPORTANT] TC-PROD-008**: "displayed in list" — where exactly?
- Evidence: `"Image saved and displayed in list"`
- Recommendation: `"Thumbnail (40x40) hiển thị trong cột đầu của bảng products"`.

**[IMPORTANT] TC-CUST-019**: Two failure inputs combined into single test.
- Evidence: `"Enter 'abc123' hoặc số ít hơn 10 chữ số"`
- Recommendation: Split into 2 TCs (non-numeric vs too-short) — they may have different error messages.

---

## IMPORTANT — Vague Preconditions

**[IMPORTANT] TC-AUTH-014**: "User logged in >30min idle" — depends on session config not specified.
- Evidence: `"User logged in >30min idle"`
- Recommendation: State assumed timeout: `"Session timeout configured = 30 min. User idle > 31 min."`. Also: how to simulate idle in test (skip clock vs real wait)?

**[IMPORTANT] TC-DASH-002**: Doesn't specify required data shape.
- Evidence: `"Orders & revenue exist today"`
- Recommendation: `"Seed: 3 paid orders today (totals 100k/200k/300k), 2 pending orders today. Expected: revenue card = 600,000 VND, count card = 5"` — gives concrete expected value.

**[IMPORTANT] TC-PROD-005**: "page count" depends on data count not given.
- Evidence: `"Pagination 10/25/50 items / >50 products exist"`
- Recommendation: `"Seed: 60 products. Set page size 25 → expect 3 pages (25+25+10), 'Showing 1-25 of 60'"`.

**[IMPORTANT] TC-ORD-005/006/007**: "Orders exist with X status" without count/distribution.
- Evidence: `"Orders exist with pending payment"`
- Recommendation: Specify: `"Seed 5 Pending + 3 Paid + 2 Failed. Filter Pending → list shows exactly 5 rows"`.

**[IMPORTANT] TC-DASH-006**: Manager logged in — but TC under "Dashboard" general section. Needs role context tag.

**[IMPORTANT] TC-ERROR-002**: "Wait 30+ seconds" depends on timeout config.
- Evidence: `"Wait 30+ seconds"`
- Recommendation: State configured request timeout in env (e.g., axios timeout=20s) and verify spinner persists then error toast at 20s.

---

## IMPORTANT — Wrong/Inconsistent Priority

**[IMPORTANT] TC-DASH-001**: Dashboard load on login = critical path; P1 correct, but TC-DASH-002 (KPI correctness) marked P2 — KPI showing wrong revenue is more critical than display itself. Suggest P1.

**[IMPORTANT] TC-PROD-018 (Duplicate name allowed)**: P2 too high for a "design decision validation" test. Suggest P3.

**[IMPORTANT] TC-AUTH-014 (Session timeout)**: P3 too low for security-related behavior. Suggest P2 — session expiry is a security control.

**[IMPORTANT] TC-ORD-018 (Cancel order - restores stock)**: P2 — but stock corruption from cancel is a data-integrity bug. Suggest P1.

**[IMPORTANT] TC-SUPP-ORD-008 (Stock increases on delivered)**: P2 — same data-integrity concern as TC-ORD-018. Should be P1 (mirrors decrement on cancel).

**[IMPORTANT] TC-ERROR-009 (Form validation - missing required field)**: P2; this is the most basic UX guarantee, listed once generically here while individual modules also test it. Either remove (redundant) or elevate to P1 as smoke test.

**[IMPORTANT] TC-CHAT-007 (Send message fails)**: P2; offline failure handling is high-priority for chat reliability — consider P1 if chat is critical to business.

**[IMPORTANT] TC-AUTH-015 (Multi-session)**: Description says "User2 session replaced" but step 1 is "Clear cookies/storage" — that's not multi-session. Test is testing fresh-login, not concurrent sessions. P3 priority probably okay; but TC is mislabeled.

---

## IMPORTANT — Implicit Test Dependencies / Independence Issues

**[IMPORTANT] TC-ORD-013**: Depends on TC-ORD-012 ("partial paid") state.
- Evidence: `"Precondition: Order exists, partial paid"`
- Recommendation: State explicitly: `"Setup: create order total=1,000,000 then record payment of 400,000 (depends on payment-record functionality working). Run AFTER TC-ORD-012 OR use seeded fixture."`

**[IMPORTANT] TC-ORD-015/016**: Sequential status flow tests without fixture isolation.
- Recommendation: Each TC should seed its own starting state (e.g., TC-ORD-016 should seed an order in Shipped state directly via fixture/DB rather than depending on TC-ORD-014→015 having run).

**[IMPORTANT] TC-DEBT-007**: Depends on TC-DEBT-005's payment behavior.
- Recommendation: Independently seed `customer with single unpaid order, debt=500000`.

**[IMPORTANT] TC-SUPP-ORD-007 vs TC-SUPP-ORD-008**: Overlapping; -007 also checks stock, -008 is duplicate.
- Recommendation: Merge or differentiate (e.g., -008 specifies exact qty math, -007 just status transition).

**[IMPORTANT] TC-SETTINGS-007**: Tier recalculation precondition `"Customer A spent 500,000"` — but no Customer A is seeded by previous TC.
- Recommendation: Add explicit fixture: `"Seed Customer A with total_spent=500,000; Gold tier currently min=500,000 → A has Gold badge"`.

---

## IMPORTANT — Missing Steps / Reproducibility Gaps

**[IMPORTANT] TC-AUTH-008/009**: "Login as Staff/Manager" without saying how (test user creds, seed account).
- Recommendation: Reference seeded test users or state username/role: `"Login as test_staff_01 (role=Staff)"`.

**[IMPORTANT] TC-PROD-002**: "Wait 300ms" — debounce timing assumption.
- Evidence: `"3. Wait 300ms"`
- Recommendation: Either reference debounce constant in spec, or specify `"After typing stops, wait until network request fires (observable via DevTools Network tab)"`.

**[IMPORTANT] TC-PROD-013**: "Hover product row 2. Click delete dropdown" — assumes hover-to-reveal which fails on touch/mobile.
- Recommendation: State viewport (desktop), or also cover mobile (separate TC).

**[IMPORTANT] TC-ORD-014**: "history recorded" — verification method missing.
- Recommendation: `"Open status timeline section in detail; verify new row: status=Confirmed, timestamp=now (±5s), user=current admin"`.

**[IMPORTANT] TC-CUST-002/003/004**: "real-time / List filters" — no debounce spec, no count assertion.
- Recommendation: Specify debounce time and how to verify (count of rows changes from N to M).

**[IMPORTANT] TC-CHAT-001**: "unread count" — undefined how it's computed (per-room? global? read state per admin user?).
- Recommendation: Clarify: count = messages from customer not yet acknowledged by current admin user.

**[IMPORTANT] TC-ERROR-010**: "Resize to mobile width" — no specific breakpoint.
- Recommendation: `"Resize viewport to ≤768px (md breakpoint)"`.

**[IMPORTANT] TC-AUTH-001**: Doesn't specify that session cookie actually gets set.
- Evidence: `"session set"` — vague
- Recommendation: `"Verify: cookie 'admin_session' set (HttpOnly, Secure, SameSite=Lax) with non-empty value via DevTools → Application → Cookies"`.

---

## MODERATE — Style/Clarity (less critical but reduces quality)

**[MODERATE] TC-AUTH-007**: "Try back button" — browser back vs in-app back unclear.
- Recommendation: `"Press browser back button"`.

**[MODERATE] TC-PROD-019**: TC says "(role check)" which is meta-comment, not actionable.
- Evidence: `"Product created (role check)"`
- Recommendation: Remove parenthetical; just: `"Product created and appears in list"`.

**[MODERATE] TC-PROD-018**: Same — parenthetical explanation in expected result.
- Recommendation: Move design rationale to a "Notes" column or remove.

**[MODERATE] TC-CAT-001**: "Tree or list" — UI shape ambiguous.
- Recommendation: Verify spec → state which one.

**[MODERATE] TC-EXP-003**: Expected list has lowercase inconsistency.
- Evidence: `"Tiền thuê, Lương, Quảng cáo, vận chuyển, khác"` — capitalization inconsistent
- Recommendation: Match actual UI casing exactly: `"Tiền thuê, Lương, Quảng cáo, Vận chuyển, Khác"`.

**[MODERATE] TC-CUST-016**: "Reset Credentials" terminology vs TC-USERS-004 "Reset Password" — clarify if same or different feature.

**[MODERATE] TC-SETTINGS-002**: "Customer Tiers" — add: name, min spend, discount → unclear if all required or some optional.
- Recommendation: Mark required vs optional fields.

**[MODERATE] TC-ANALYTICS-001**: "Shows: Overview, Finance, Inventory, Product Analytics" — these are mentioned as sub-pages elsewhere; clarify if they're tabs, cards, or links.

**[MODERATE] TC-DASH-005**: Two assertions in one TC ("Quản lý kho" + "Sản phẩm mới") — split for independence.

**[MODERATE] TC-DASH-008**: "Revenue & order count updated" — by how much? Specify delta.

**[MODERATE] TC-USERS-004**: "8 chars" — generated password complexity rules undefined (alphanumeric? symbols?).

**[MODERATE] TC-CHAT-005**: "Send button disabled when empty" — what about whitespace-only?
- Recommendation: Add edge case: `"Empty OR whitespace-only → disabled"`.

**[MODERATE] TC-ERROR-008**: "max 10MB" — ensure consistency with actual config (in env or spec).

**[MODERATE] TC-SUPP-ORD-001**: Many TCs use "Table shows X, Y, Z" — list columns explicitly with order matters or not.

**[MODERATE] TC-AUTH-009**: "Hidden" → unclear if rendered DOM or absent. For screen-reader/accessibility tests this matters.
- Recommendation: `"Module not present in sidebar DOM (not just visually hidden via CSS)"` if RBAC enforces it.

---

## Cross-Cutting Observations

1. **No expected error code locations standard**. Many TCs say only "Error" or "Error toast" — recommend adopting standard categories: `inline-field-error | toast | dialog-error | full-page-error` and labeling consistently. (Some recent TCs do this — TC-PROD-020+ — but inconsistent before.)

2. **No data-fixture references**. TCs assume "Customers exist", "Products exist" without referencing a shared fixture/seed dataset. Recommend defining `qa-fixtures.md` with named seeds (e.g., `Seed-A: 10 products across 3 categories`) and reference by name.

3. **Performance TCs lack methodology** (TC-DASH-007, TC-ERROR-007). Either remove from manual TC list and move to perf-test plan, or specify tool + condition.

4. **RBAC tests duplicated**. TC-AUTH-008..013 + TC-EXP-008..009 + TC-ANALYTICS-006 + TC-USERS-006/009 + TC-SETTINGS-006/012 — all enforce same matrix. Suggest consolidating into single matrix-driven RBAC suite per role × URL.

5. **No negative test for SQL injection / XSS** in input fields (search, names, descriptions). Even basic security TCs missing — should add at least 2-3 (e.g., search input with `<script>alert(1)</script>` does not execute).

6. **No test for concurrent stock updates** (race condition: two orders for last item in stock). Only TC-ERROR-005 hints at concurrency on edit. Critical for inventory correctness.

7. **No test for soft-delete vs hard-delete semantics** for products/customers. Activate/deactivate exists for customers but products only "delete".

---

## Summary

- TCs reviewed: 185
- Issues found: 60
  - CRITICAL: 7 (ambiguous expected — block testability)
  - IMPORTANT: 33 (vague preconditions/results, wrong priority, dependencies, missing steps)
  - MODERATE: 20 (style, terminology, completeness)
- Common patterns:
  - "or" / "hoặc" in expected results (8 TCs) — pick one outcome
  - Vague seed data ("X exist") without quantity/values — 12 TCs
  - Missing error-location classification (inline vs toast) — 9 TCs
  - Implicit test dependencies — 4 chains identified
- Strong points:
  - Recent TCs (PROD-020+, ORD-023+, SUPP-009+, SETTINGS-009+) consistently specify error location ("Inline error dưới field..."). Apply this standard retroactively.
  - Priority breakdown reasonable overall; few mis-tagged.

---

## Unresolved Questions

1. Are TCs intended to be manual or automated? Affects required precision (automated needs concrete fixtures; manual tolerates "X exists").
2. Is there a fixture/seed dataset doc to reference (e.g., `qa-fixtures.md`)? If not, should one be created?
3. For "or" expected results — should I draft the deterministic version based on inferred actual UI behavior, or wait for product to decide?
4. Performance TCs (DASH-007, ERROR-007) — keep in functional suite or move to dedicated perf plan?
5. Should RBAC matrix tests be consolidated into a single parameterized suite (per role × per URL → expect allow/deny) instead of 12+ individual TCs?
6. Security/injection negative tests — out of scope for this doc, or should be added?
7. TC-AUTH-015 looks mislabeled (clears storage = not multi-session). Confirm intent.
