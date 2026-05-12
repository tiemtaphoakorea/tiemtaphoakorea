# Module: Reports — Báo cáo tài chính (`/reports`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/reports/profit-loss/` (only sub-route observed).
> Sidebar link: "Báo cáo tài chính" → href=`/reports`.
> **Note**: KHÔNG có file `app/(dashboard)/reports/page.tsx` trực tiếp — chỉ có `profit-loss/`. Có thể `/reports` redirect to `/reports/profit-loss` hoặc 404.

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| Profit & Loss | `/reports/profit-loss` | P&L statement: revenue / COGS / gross profit / expenses / net profit. Date range. Export. |

---

## (I) Interaction Test Cases

### US-REPORT-I001 — Date range selector

**Acceptance Criteria**:
- AC1 (Default range**): Current month or last 30d.
- AC2 (Custom range**).
- AC3 (Preset options**): Hôm nay / Tuần / Tháng / Quý / Năm.

### US-REPORT-I002 — Loading & empty state

Skeleton while query loading. Empty state if no data.

### US-REPORT-I003 — Export Excel (TC-ACC-006)

Click → .xlsx file downloads with current data.

### US-REPORT-I004 — Navigation `/reports` → `/reports/profit-loss`

**Acceptance Criteria**:
- AC1 (Sidebar click**): Navigate to `/reports`.
- AC2 (Redirect or 404?**): If no index page, sidebar should target `/reports/profit-loss` directly. **Bug candidate**.

---

## (B) Business Test Cases

### US-REPORT-B001 — P&L formula

**Acceptance Criteria**:
- AC1 (Revenue**): SUM(orders.total) excluding cancelled, in range.
- AC2 (COGS**): SUM(order_items.qty * unitCostSnapshot) — cost frozen at sale time.
- AC3 (Gross profit**): Revenue - COGS.
- AC4 (Expenses**): SUM(expenses.amount) in range.
- AC5 (Net profit**): Gross - Expenses.

### US-REPORT-B002 — Cost snapshot vs current cost (TC-ACC-003)

Use `order_items.unitCostSnapshot` (frozen) — không live `productVariants.costPrice`. Critical for historical accuracy when WAC changes.

### US-REPORT-B003 — Cancelled orders excluded (TC-ACC-011)

Revenue + COGS exclude cancelled. Existing TC has false positive `toBeLessThan`.

### US-REPORT-B004 — Date boundary inclusivity (TC-ACC-012)

`>= startDate AND <= endDate`. Hardcoded year=2026 in existing test — flag for fix.

### US-REPORT-B005 — Per-category profit breakdown

Optional: group profit by category for inventory mix analysis.

### US-REPORT-B006 — Export content integrity (TC-ACC-006)

Excel rows match UI exactly (currently UI=hidden in existing TC — needs both).

### US-REPORT-B007 — RBAC

Only Owner+Manager see reports (Staff blocked).

---

## Linked TC-IDs

TC-ACC-001..015 cross-ref accounting tests. TC-FIN-001..003 (Finance dashboard) cross-ref.

## Notes

- **/reports index page missing**: Sidebar links to `/reports` but folder only has `profit-loss/`. Likely 404 or shows folder listing. **Bug**.
- Other reports planned: Inventory valuation, Customer LTV, Supplier debt, Top products by profit (TC-ACC-005).
- Real-time vs scheduled report? Currently real-time query. Consider caching for large date ranges.
- Multi-currency? Not implemented.
- Comparison mode (current vs previous period)? Recommend.
- Drill-down: click profit number → show contributing orders.
