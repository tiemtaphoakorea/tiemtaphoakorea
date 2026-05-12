# Gap Report — Admin User-Story TCs vs Existing `docs/035-QA/`

> 2026-05-12 | Branch: dev `6fcc621`
> Compares user-story TCs trong `./test-cases/` với TC-* hiện có trong `docs/035-QA/QA-MOC.md` + `TEST-STATUS.md`.

## Summary

| Category | Count | Note |
|----------|-------|------|
| **NEW modules** (no existing TC-*) | 7 | purchases, receipts, payouts, debts, settings, content, homepage, widgets |
| **EXTENDED modules** (existing TC + new I/B) | 12 | products, orders, customers, suppliers, users, expenses, chat, dashboard, analytics, categories, supplier-orders, login |
| **OBSOLETE / DEPRECATED candidates** | 1 | supplier-orders (sidebar removed — likely replaced by purchases+receipts) |
| **MISSING in docs** (defined here, not in QA-MOC) | 1 | reports (sidebar exists, no TC-* in QA-MOC) |
| **BUGS uncovered while writing TCs** | 6 | listed below |

---

## A. NEW user-story TCs (no equivalent TC-* exists)

### A.1 — Purchases module (mới hoàn toàn)
- US-PURCH-I001..I010 (10 interaction)
- US-PURCH-B001..B010 (10 business)

→ Recommend tạo TC-PURCH-001..020 trong `docs/035-QA/Test-Cases/`.

### A.2 — Receipts module (mới)
- US-RECEIPT-I001..I010 (10 interaction)
- US-RECEIPT-B001..B011 (11 business — bao gồm WAC, payment status derivation, supplier backfill)

→ Recommend TC-RECEIPT-001..021.

### A.3 — Payouts module (mới)
- US-PAYOUT-I001..I007 + US-PAYOUT-B001..B012 (19 total)

→ Recommend TC-PAYOUT-001..019.

### A.4 — Debts module (mới, có sub-detail)
- US-DEBT-I001..I007 + US-DEBT-B001..B011 (18 total)

→ Recommend TC-DEBT-001..018. **Lưu ý**: phát hiện 2 bug filter (xem section D).

### A.5 — Settings module (mới)
- US-SET-I001..I009 + US-SET-B001..B011 (20 total)

→ Recommend TC-SET-001..020.

### A.6 — Content module (mới)
- US-CONTENT-I001..I006 + US-CONTENT-B001..B008 (14 total)

→ Recommend TC-CONTENT-001..014.

### A.7 — Homepage module (mới)
- US-HOME-I001..I010 + US-HOME-B001..B012 (22 total)

→ Recommend TC-HOME-001..022.

### A.8 — Widgets module (mới)
- US-WIDGET-I001..I003 + US-WIDGET-B001..B004 (7 total)

→ Recommend TC-WIDGET-001..007.

### A.9 — Inventory module (chỉ có TC-PROD-010/018 chạm)
- US-INV-I001..I010 + US-INV-B001..B012 (22 total)

→ Recommend TC-INV-001..022 (riêng biệt khỏi TC-PROD-*).

### A.10 — Reports module (mới)
- US-REPORT-I001..I004 + US-REPORT-B001..B007 (11 total)

→ Recommend TC-REPORT-001..011.

---

## B. EXTENDED user-story TCs cho modules có TC sẵn

### B.1 — Products: covered + extended

| Existing | Status | New US adds |
|----------|--------|-------------|
| TC-PROD-002 (List Search/Filter) | needs-fix | + URL filter persist, Tab count parallel, Bulk select |
| TC-PROD-007 (Cost History) | needs-fix | Cross-ref WAC log (US-RECEIPT-B002) |
| TC-PROD-012 (Deactivate) | needs-fix (dead) | Fresh I tests cần |
| TC-PROD-022 (Negative Stock) | draft | **conflict** với US-INV-B002 AC4 — current code không enforce |

**Specifically new**: US-PROD-I001 (bulk select), I002 (bulk delete pre-check), I003 (URL filter), I004 (tab counts), B002 (deletability), B005 (filter+page combo).

### B.2 — Orders: covered + extended

Existing TC-ORD-001..028 cover phần lớn business. New US-ORD-I001..I007 cover gaps tương tác.

Cross-ref đã xác định mismatch:
- TC-ORD-007 (filter false positive) → US-ORD-I001 replaces.
- TC-ORD-012/015/023 (false positive `toBe(500)` for business rules) → service throws 400/409 actually.
- TC-ORD-027 (variant format dead assertion) → US-ORD-* phải rewrite.
- TC-ORD-028 (E2E lifecycle missing) → recommend new spec.

### B.3 — Customers: covered + extended

- TC-CUST-001 false positive → US-CUST-I003 + B003 (address regression after commit `6fcc621`).
- TC-CUST-010 tautology → fix bằng US-CUST-B002.
- TC-CUST-011, 012 missing → covered bởi US-CUST-I003 + B006.

### B.4 — Suppliers: minor extension

US-SUP-* extend TC-SUP-001..005. Chỉ note thêm bug `35c42bc` (supplier backfill on receipt) — không direct test.

### B.5 — Users / Expenses / Chat / Dashboard / Analytics / Categories / Login

Existing TCs cover core. New US-* tập trung vào:
- Interaction tests (existing E2E weak ở khía cạnh này — nhiều false positive).
- Fixing false positives (TC-AUTH-007, TC-DASH-008/010, TC-CAT-005, TC-CHAT-005/006, TC-ACC-011, etc.).

### B.6 — Supplier-orders: **DEPRECATION candidate**

- Sidebar mới (sidebar admin observed 2026-05-12) **KHÔNG có** mục `/supplier-orders`.
- Likely module này được replace bởi `/purchases` (đặt hàng nhập) + `/receipts` (nhập hàng) + `/payouts` (phiếu chi).
- TC-SUP-ORDER-001..028 (28 tests, nhiều needs-fix) → **action needed**:
  - (a) Confirm với team: deprecated chưa?
  - (b) Nếu YES → archive 28 TC + migrate concepts sang TC-PURCH-* + TC-RECEIPT-*.
  - (c) Nếu NO → fix existing + thêm Interaction TCs.

---

## C. Existing TC mismatches & fixes recommended

### C.1 — False positives toBe(500) for business rules

| TC | Issue | Recommended fix |
|-----|-------|-----------------|
| TC-ORD-012 (Delete rules) | Tests 500 instead of 400 | Test 400 + error message |
| TC-ORD-015 (Delete supplier order restrict) | Same | Same |
| TC-ORD-023 (Reject cancel after shipping) | Same | Same |
| TC-CHAT-005 (Image MIME reject) | Same | Test 400 |
| TC-SUP-ORDER-005 (Block final state) | Same | Same |
| TC-SUP-ORDER-006 (Delete restrict) | Same | Same |

### C.2 — False positives `if-guard wraps all assertions`

TC-CATALOG-001, TC-CATALOG-006, TC-CUST-001, TC-CUST-006, TC-CUST-010, TC-CHAT-006, TC-DASH-008, TC-DASH-010, TC-FIN-002, TC-ACC-004, TC-ACC-005, TC-ACC-008, TC-ORD-020, TC-SUP-ORDER-011, TC-SUP-ORDER-020.

→ Common pattern: `if (element.isVisible()) { /* assertions */ }` → skips silently. Must reorganize to FAIL when element missing.

### C.3 — Dead code (broken imports)

TC-PROD-012, TC-CHAT-001, TC-CHAT-002, TC-CHAT-008, TC-SEC-007, TC-ACC-002.

→ Fix imports + verify against current codebase.

### C.4 — Hardcoded fragile values

TC-ACC-001, TC-ACC-012, TC-INT-008: hardcoded `month=1, year=2026` → fail when time passes. Use dynamic dates.

TC-PROD-002, TC-CATALOG-005: hardcoded SKU/password → fragile across re-runs.

---

## D. Bugs uncovered while writing TCs

### D.1 — Debts filter `minAgeDays=0` for "< 7 ngày" tab

File: `packages/database/src/services/debt.server.ts:62-65`

```ts
if (minAgeDays != null) {
  const cutoff = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000).toISOString();
  query = query.where(sql`${subquery.oldestDebtDate} <= ${cutoff}`);
}
```

UI maps tab `fresh` → `minAgeDays=0` → cutoff=NOW → keeps `oldestDebtDate ≤ NOW` (always true).

**Effect**: Tab "< 7 ngày" thực ra hiển thị tất cả debts, không lọc theo age.

**Fix**: Map `fresh` → no filter (`null`) OR add `maxAgeDays` parameter để upper-bound.

### D.2 — Debts overlap "7-30 ngày" vs "> 30 ngày"

Cùng file. Tab `old` → minAgeDays=7 (debt ≥ 7 ngày, không có upper); tab `very_old` → ≥ 30. Vì `very_old` ⊂ `old`, 2 tabs chồng chéo.

**Fix**: Pass cả `minAgeDays` + `maxAgeDays`; map tabs:
- fresh: `maxAgeDays=7`
- old: `minAgeDays=7, maxAgeDays=30`
- very_old: `minAgeDays=30`

### D.3 — Reports sidebar link target

Sidebar href=`/reports` nhưng folder `apps/admin/app/(dashboard)/reports/` không có `page.tsx` — chỉ có `profit-loss/page.tsx`.

**Effect**: Click sidebar "Báo cáo tài chính" → likely 404 (verify).

**Fix**:
- Option A: Create `/reports/page.tsx` index với link cards tới sub-reports.
- Option B: Sidebar link đổi sang `/reports/profit-loss`.
- Option C: Next.js redirect `/reports` → `/reports/profit-loss`.

### D.4 — Inventory `adjustInventory` không clamp ≥0

File: `packages/database/src/services/inventory.server.ts:189`

```ts
await tx
  .update(productVariants)
  .set({ onHand: sql`${productVariants.onHand} + ${quantity}` })
  .where(eq(productVariants.id, variantId));
```

Quantity âm có thể đẩy onHand < 0 (no clamp).

**Effect**: Manual adjustment với qty quá lớn có thể tạo negative inventory.

**Fix**: SQL `GREATEST(${onHand} + ${quantity}, 0)` OR pre-check trước update + throw if would-be-negative.

→ TC-PROD-022 (draft) chính là test này — service implementation phải sync.

### D.5 — Receipts banner condition khi chỉ có outOfStock

File: `apps/admin/app/(dashboard)/inventory/_content.tsx:92-105`

Banner render khi `lowStock > 0 || outOfStock > 0`. Nhưng phần "{N} SP sắp hết" luôn render, không có conditional. → Khi chỉ outOfStock > 0, banner hiển thị "0 SP sắp hết · 5 SP đã hết hàng".

**Effect**: UX nhỏ — "0 SP sắp hết" không cần thiết.

**Fix**: Conditional render từng segment.

### D.6 — Settings race condition: GET overrides user typing

File: `apps/admin/app/(dashboard)/settings/_content.tsx:38-50`

useEffect chỉ chạy `[]` mount-time. Nếu user gõ trước khi API trả → state bị overwrite khi response arrives.

**Effect**: Hiếm gặp (mạng chậm) nhưng có thể frustrating.

**Fix**: Track "dirty" flag — chỉ setState nếu user chưa edit.

Tương tự: `content/_content.tsx` (footer + social), `homepage/_content.tsx` (SEO config).

---

## E. Test infrastructure recommendations

### E.1 — Eliminate `if-guard` anti-pattern

Conventions cho future TC writers (add to `.claude/rules/`):
- ❌ `if (await el.isVisible()) { await expect(el).toHaveText(...) }`
- ✅ `await expect(el).toBeVisible(); await expect(el).toHaveText(...)`

### E.2 — Status code expectations cho business rules

- ❌ `expect(res.status).toBe(500)` cho business rule reject
- ✅ `expect(res.status).toBeOneOf([400, 409])` với error code assertion

### E.3 — Dynamic dates

- ❌ `await page.fill('input[name=month]', '1');`
- ✅ `await page.fill('input[name=month]', String(new Date().getMonth()+1));`

### E.4 — Stable test data (testRunId pattern)

Per playwright config — `workers: 2` due to testRunId. Continue using `testRunId` suffix cho fixture data, đặc biệt SKU/email/phone.

### E.5 — Add Interaction Suite

E2E hiện thiên về business (API + final state). Add Interaction Suite:
- Focus states (tab navigation)
- Keyboard shortcuts
- Toast messages exact text
- Loading skeleton appearance
- Disabled states (button greyed)
- Optimistic UI updates

---

## F. New test-case ID allocation proposal

Để map user stories sang traditional TC-XXX-NNN format trong `docs/035-QA/`:

| Module | New TC-* prefix | Range |
|--------|-----------------|-------|
| Purchases | TC-PURCH | 001-020 |
| Receipts | TC-RECEIPT | 001-021 |
| Payouts | TC-PAYOUT | 001-019 |
| Debts | TC-DEBT | 001-018 |
| Inventory | TC-INV | 001-022 |
| Settings | TC-SET | 001-020 |
| Content | TC-CONTENT | 001-014 |
| Homepage | TC-HOME | 001-022 |
| Widgets | TC-WIDGET | 001-007 |
| Reports | TC-REPORT | 001-011 |

Total proposed new TCs: **~174**.

---

## G. Action items (prioritized)

| Priority | Action | Module(s) | Owner |
|----------|--------|-----------|-------|
| P0 | Fix Debts age filter bug (D.1, D.2) | debts | Backend |
| P0 | Fix `/reports` index page (D.3) | reports | Frontend |
| P1 | Decision: deprecate supplier-orders? | supplier-orders | Product |
| P1 | Fix toBe(500) false positives (C.1) | various | QA |
| P1 | Fix if-guard false positives (C.2) | various | QA |
| P1 | Promote inventory `adjustInventory` non-negative guard (D.4) | inventory | Backend |
| P2 | Add Interaction Suite specs | all | QA |
| P2 | Implement new TC-PURCH/RECEIPT/PAYOUT/DEBT specs | 4 new modules | QA |
| P3 | Race condition guards (D.6) | settings/content/homepage | Frontend |
| P3 | Inventory banner cosmetic (D.5) | inventory | Frontend |

---

## H. Open questions

1. **Supplier-orders deprecated?** Confirm with product team.
2. **Branch (multi-warehouse) plan?** Schema có `branchId` nhưng UI không expose — verify roadmap.
3. **`stock_count_balance` movement type usage?** Defined trong enum nhưng không có service path — verify if `/stocktake` route planned.
4. **`cost_adjustment` movement usage?** Defined nhưng không tạo từ service nào.
5. **AI Agent chat coverage?** Toggle `AI_AGENT_ENABLED`. Cần TC suite riêng.
6. **Multi-tenancy roadmap?** Single-row settings table — `shop_id` FK cần khi scale.
7. **Audit logging policy?** Hiện chỉ có cost_price_history. Cần unified `audit_log` table cho settings/users/roles changes.
8. **Refund flow?** Cancel order keeps payments — không có true refund mechanism.

---

## Files generated

```
plans/260512-0214-admin-user-story-tc/
├── plan.md                          # Plan document
├── GAP-REPORT.md                    # This file
└── test-cases/
    ├── INDEX.md
    ├── 00-login.md
    ├── 01-dashboard.md
    ├── 02-purchases.md
    ├── 03-receipts.md
    ├── 04-payouts.md
    ├── 05-debts.md
    ├── 06-inventory.md
    ├── 07-settings.md
    ├── 08-content.md
    ├── 09-homepage.md
    ├── 10-products.md
    ├── 11-orders.md
    ├── 12-customers.md
    ├── 13-suppliers.md
    ├── 14-users.md
    ├── 15-expenses.md
    ├── 16-chat.md
    ├── 17-analytics.md
    ├── 18-categories.md
    ├── 19-supplier-orders.md
    ├── 20-widgets.md
    └── 21-reports.md
```

22 test-case files, ~290+ user stories total (190+ Interaction, 100+ Business).
