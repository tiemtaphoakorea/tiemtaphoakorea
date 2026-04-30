# Analytics & Finance Consolidation Design

**Date:** 2026-04-30  
**Status:** Approved

## Problem

The admin currently has three overlapping report areas:

- `/` (Dashboard) — KPI cards + top products + recent orders
- `/analytics` — revenue charts, top products, inventory (tabs)
- `/finance` + `/finance/detail` + `/finance/detail/[date]` — P&L monthly + date-range + single day

This causes confusion: top products appears on both dashboard and analytics; there is no single place to find all financial data; the sidebar has a separate "Tài chính" entry that duplicates intent with "Báo cáo".

## Goals

1. One place for all reports (`/analytics` and sub-routes)
2. Dashboard stays useful as an operational overview — not a mini-report
3. No duplicate content across pages
4. Mobile-first throughout
5. Shareable URLs for all views including day drilldown

---

## Route Structure

```
BEFORE                          AFTER
/                               /                        (operational overview)
/analytics                      /analytics               (hub: 4 summary cards + 7-day chart)
/finance               ─┐       /analytics/overview      (revenue charts + category sales)
/finance/detail         ├─ DEL  /analytics/products      (top products)
/finance/detail/[date]  ─┘      /analytics/inventory     (stock levels + alerts)
                                /analytics/finance        (P&L + daily table + day drawer)
```

---

## 1. Dashboard `/`

**Purpose:** At-a-glance operational status. Action-oriented, not analytical.

**Content:**
- Page header: "Trung tâm điều hành" + date + CTA buttons (Sản phẩm mới, Quản lý kho)
- **Today KPI cards** (4 cards, 2-col mobile / 4-col desktop):
  - Doanh thu hôm nay (revenue from completed orders today)
  - Đơn hàng hôm nay (order count)
  - Lợi nhuận ròng hôm nay
  - Khách hàng mới hôm nay
- **Đơn hàng gần đây** (keep `DashboardRecentOrders`)
- **Cảnh báo tồn kho** — count of low/out-of-stock products, link → `/analytics/inventory`
- **Công nợ cần thu** — total debt amount + count of overdue customers, link → `/debts`
- Footer link: "Xem báo cáo đầy đủ →" → `/analytics`

**Removed from dashboard:**
- `DashboardKPIs` component (replaced by today-specific KPI cards above)
- `DashboardTopProducts` component (available at `/analytics/products`, not action-oriented)

**New component needed:** `DashboardTodayKPIs` — fetches today's stats. Can reuse the existing `/api/admin/analytics` endpoint filtered to today, or a new `/api/admin/stats/today` endpoint if needed.

---

## 2. Analytics Hub `/analytics`

**Purpose:** Entry point to all reports. Quick glance at headline numbers, then drill in.

**Content:**
- Page header: "Báo cáo" + subtitle
- **4 summary cards** (2-col mobile / 4-col desktop → each tappable):

| Card | Headline | Sub-text | Links to |
|---|---|---|---|
| Tổng quan | Doanh thu hôm nay | ↑/↓ % vs yesterday | `/analytics/overview` |
| Sản phẩm | Top 1 SP name | X sold in 7 days | `/analytics/products` |
| Tồn kho | X SP sắp hết hàng | "Cần nhập thêm" | `/analytics/inventory` |
| Tài chính | LN ròng tháng này | % margin | `/analytics/finance` |

Each card has `→` chevron icon. Entire card is a `Link`.

- **Revenue chart 7 ngày** — `RevenueChart` component, keep as-is, shows below cards.

**Data sources:** Hub cards share the existing `adminClient.getAnalytics()` and `adminClient.getStockAlerts()` responses. No new endpoints needed for hub.

---

## 3. Sub-routes (each has `← Báo cáo` back link in header)

### `/analytics/overview`
Content moved from current `/analytics` tab "overview":
- `AnalyticsStats` (KPI cards)
- `RevenueChart`
- `CategorySalesChart`

No changes to these components — just relocated to a dedicated page.

### `/analytics/products`
Content moved from current `/analytics` tab "products":
- `TopProducts`

### `/analytics/inventory`
Content moved from current `/analytics` tab "inventory":
- `InventoryStats`
- `LowStockList`
- `OutOfStockList`

---

## 4. `/analytics/finance`

### Layout

```
┌─────────────────────────────────────────────┐
│ ← Báo cáo   Tài chính & Lợi nhuận          │
├─────────────────────────────────────────────┤
│ Range picker                                │
│ [Hôm nay][Hôm qua][7 ngày][Tháng này]      │  ← chips, scroll-x on mobile
│ [Tháng trước][Tháng M/Y ▾][Custom from-to] │
├─────────────────────────────────────────────┤
│ KPI: Doanh thu | COGS | Chi phí | LN ròng   │  ← 2 col mobile / 4 col desktop
│       each with ↑↓ delta vs previous period │
├─────────────────────────────────────────────┤
│ P&L Breakdown (lg:col-span-2)               │
│ Scorecard (lg:col-span-1)                   │
├─────────────────────────────────────────────┤
│ Bảng theo ngày (only when range > 1 day)    │  ← table desktop / card list mobile
│ Ngày | DT | COGS | Chi phí | LN | % → tap  │
└─────────────────────────────────────────────┘
```

### Range picker
- Preset chips: Hôm nay · Hôm qua · 7 ngày · Tháng này · Tháng trước
- Month/year dropdowns for full-month P&L (replaces the month selector on old `/finance`)
- Custom: date range picker (two date inputs)
- URL sync: `?from=YYYY-MM-DD&to=YYYY-MM-DD` — page is shareable/bookmarkable

### KPI cards
- Doanh thu gộp, COGS, Chi phí vận hành, Lợi nhuận ròng
- Each shows delta % vs equivalent previous period (reuse `getPrevRange` logic from old `/finance/detail`)
- Mobile: 2-col grid; desktop: 4-col grid

### P&L Breakdown + Scorecard
- Keep existing UI from `FinanceStats` unchanged (Revenue → COGS → Gross Profit → Expenses → Net Profit stack)
- Scorecard: % margin + GOOD/AVG/POOR label + advisory message
- Remove the "Xem báo cáo chi tiết" button (route no longer exists)
- Desktop: breakdown 2/3 width + scorecard 1/3; Mobile: stacked vertically

### Daily breakdown table
- Shown only when range spans more than 1 day
- Desktop: `<table>` with columns: Ngày · DT · COGS · Chi phí · LN ròng · % margin
- Mobile: card list — each card shows date, DT, LN, % margin; tap opens Drawer
- Sort by date descending by default; columns sortable on desktop
- Requires new API endpoint: `GET /api/admin/finance/daily?from=&to=` returning array of daily stats
  - (Existing: `GET /api/admin/finance/daily/[date]` only returns single day — insufficient)

### Day Drawer
- Trigger: tap row in daily table, or auto-open when preset = "Hôm nay" / "Hôm qua"
- URL sync: `?from=...&to=...&day=YYYY-MM-DD` — share link opens page with drawer open
- Desktop: `Sheet` from right, `max-w-[640px]`
- Mobile: `Drawer` (vaul bottom sheet), `~85vh`, drag-to-close handle
- Content: 4 KPI cards for the day + list of completed orders + expense breakdown by category
- Data: `GET /api/admin/finance/daily/[date]` (already exists)

### Edge cases
- Range with zero orders → empty state: "Không có giao dịch trong khoảng này"
- Negative net profit → LN ròng card red, scorecard shows POOR
- Custom range > 90 days → warning banner above table: "Khoảng thời gian rộng, có thể mất vài giây..."
- Each section (KPI / breakdown / table) wraps independently in Suspense+skeleton so they load progressively

---

## 5. Sidebar

Remove "Tài chính" entry (`PieChart` icon, `ADMIN_ROUTES.FINANCE`).  
Keep "Báo cáo" entry → `/analytics`.

---

## 6. Files

### Delete
```
apps/admin/app/(dashboard)/finance/                     (entire folder)
apps/admin/components/admin/dashboard/dashboard-kpis.tsx
apps/admin/components/admin/dashboard/dashboard-kpis-skeleton.tsx
apps/admin/components/admin/dashboard/dashboard-top-products.tsx
apps/admin/components/admin/dashboard/dashboard-top-products-skeleton.tsx
```

### Create
```
apps/admin/app/(dashboard)/analytics/overview/page.tsx
apps/admin/app/(dashboard)/analytics/products/page.tsx
apps/admin/app/(dashboard)/analytics/inventory/page.tsx
apps/admin/app/(dashboard)/analytics/finance/page.tsx
apps/admin/components/admin/analytics/analytics-hub-cards.tsx
apps/admin/components/admin/analytics/finance-range-picker.tsx
apps/admin/components/admin/analytics/finance-day-drawer.tsx
apps/admin/components/admin/dashboard/dashboard-today-kpis.tsx
apps/admin/components/admin/dashboard/dashboard-stock-alert.tsx
apps/admin/components/admin/dashboard/dashboard-debt-summary.tsx
apps/admin/app/api/admin/finance/daily/route.ts          (list endpoint, range param)
```

### Modify
```
apps/admin/app/(dashboard)/analytics/page.tsx            → hub layout
apps/admin/app/(dashboard)/page.tsx                      → replace KPIs+TopProducts with new widgets
apps/admin/components/layout/admin-sidebar.tsx           → remove Finance entry
apps/admin/components/admin/finance/finance-stats.tsx    → remove router.push to old /finance/detail
packages/shared/src/routes.ts                            → remove FINANCE, add ANALYTICS sub-routes
apps/admin/lib/query-keys.ts                             → add dailyRange query key
apps/admin/services/admin.client.ts                      → add getDailyFinanceRange() method
```

---

## 7. Trade-offs

| | |
|---|---|
| ✅ | Single "Báo cáo" entry in sidebar, no duplicate menu |
| ✅ | Dashboard stays operational (today-focused), reports stay analytical (period-flexible) |
| ✅ | Top products no longer duplicated across dashboard + analytics |
| ✅ | All P&L views in one route tree under `/analytics/finance` |
| ✅ | Shareable URLs preserved at every level including day drawer |
| ✅ | Mobile-first: 2-col cards, chip scroll-x, bottom drawer |
| ⚠️ | One new API endpoint needed (`/api/admin/finance/daily?from&to`) |
| ⚠️ | Dashboard KPI cards will show today-only data — no period selector (intentional: period analysis lives in `/analytics`) |
