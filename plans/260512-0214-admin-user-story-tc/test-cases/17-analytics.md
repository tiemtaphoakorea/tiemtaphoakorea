# Module: Analytics — Phân tích (`/analytics`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/analytics/` (subpages: overview, products, finance, inventory, debts).
> Existing TC: TC-ANALYTIC-001..002 (needs-fix).

## Screen Inventory

| Subpage | Route | Notes |
|---------|-------|-------|
| Overview | `/analytics` | AnalyticsHeader + AnalyticsStats + RevenueChart (dynamic import). |
| Products | `/analytics/products` | Product performance (top selling, slow movers). |
| Finance | `/analytics/finance` | Revenue / Expense / Profit P&L. |
| Inventory | `/analytics/inventory` | XNT (Xuất-Nhập-Tồn) flow report — opening + in - out = closing. |
| Debts | `/analytics/debts` | Customer debt aging aggregate (mirrors `/debts` but with aggregate view). |

---

## (I) Interaction Test Cases

### US-ANALYTIC-I001 — Date range header

Date picker preset + custom; apply to all charts simultaneously.

### US-ANALYTIC-I002 — Revenue chart legend toggle

Click legend item → hide/show line.

### US-ANALYTIC-I003 — Export report (TC-ANALYTIC-002, TC-ACC-006)

**Acceptance Criteria**:
- AC1 (Click "Export Excel"**): Generate .xlsx file download.
- AC2 (Content matches displayed data**): Headers, rows.
- AC3 (Date range applied**): Export reflects current filter.

### US-ANALYTIC-I004 — Subpage navigation

Tabs or sidebar within /analytics. Verify URL persistence per subpage.

### US-ANALYTIC-I005 — Loading state per chart

Each chart has independent loading skeleton; failures isolated.

---

## (B) Business Test Cases

### US-ANALYTIC-B001 — Revenue chart accuracy

SUM(orders.total) GROUP BY day, exclude cancelled.

### US-ANALYTIC-B002 — Inventory flow XNT (cross-ref US-INV-B006)

Opening + In - Out = Closing computed from movements.

### US-ANALYTIC-B003 — Profit calculation uses snapshot cost (TC-ACC-003)

Profit per order = total - SUM(order_items.qty * order_items.unitCostSnapshot) - allocated expenses.

### US-ANALYTIC-B004 — Excluded cancelled orders (TC-ACC-011)

Cancelled orders NOT counted in revenue/profit; KHÔNG `toBeLessThan` (existing false positive).

### US-ANALYTIC-B005 — Date range boundaries inclusive (TC-ACC-012)

Verify start/end day inclusive in SQL `BETWEEN` or `>= AND <=`.

### US-ANALYTIC-B006 — COGS accuracy (TC-ACC-015 missing)

COGS = SUM per period using cost_price snapshot at sale time. Verify.

---

## Linked TC-IDs

TC-ANALYTIC-001..002, TC-ACC-001..015, TC-FIN-001..003. Cross-ref các modules cao hơn.

## Notes

- Chart library (Recharts? Chart.js?) — verify accessibility.
- Heavy queries: cache aggressively, consider materialized views.
- Inventory subpage cross-ref module Inventory.
- Debts subpage cross-ref module Debts (aggregate vs per-customer).
