# Analytics Page Tab Redesign

**Date:** 2026-04-19  
**Status:** Approved

## Problem

The current analytics page at `/analytics` dumps all sections onto a single long page: KPIs → monthly revenue chart → category chart → top products → inventory stats. This makes it hard to navigate and overwhelming for daily use.

## Solution

Restructure into **3 tabs** on the same `/analytics` URL. A single global year filter sits above the tab bar and applies to all time-sensitive data (revenue, products). Inventory stats are always current-state and unaffected by the filter.

---

## Tab Structure

### Tab 1 — Tổng quan (Overview)
- 4 KPI cards: Tổng doanh thu, Tổng đơn hàng, Khách hàng, Tỉ lệ chuyển đổi
- Area chart: Doanh thu theo tháng (existing `RevenueChart`)
- Horizontal bar chart: Doanh thu theo danh mục (existing `CategorySalesChart`)

### Tab 2 — Sản phẩm (Products)
- Full table of top products: rank, name, order count, revenue, growth badge
- No hard limit of 4 — show all returned by API (currently capped at 5 by `ANALYTICS_TOP_PRODUCTS_LIMIT` constant, can increase later)

### Tab 3 — Tồn kho (Inventory)
- 5 stat cards (existing `InventoryStats` component, unchanged)
- Two side-by-side lists below the cards:
  - **Sắp hết hàng** — variants where `stockQuantity > 0 AND stockQuantity <= lowStockThreshold`, sorted ascending by stock. Shows: product name, SKU, current stock count. Displays top 10 with "Xem tất cả →" link to `/products`.
  - **Hết hàng** — variants where `stockQuantity <= 0`, sorted by name. Same display format. Top 10 with "Xem tất cả →" link.

---

## Global Filter

- Year dropdown (existing, currently hardcoded to current year)
- Positioned in the page header, right-aligned, above the tab bar
- Applies to: Tab 1 (revenue/orders/customers by year), Tab 2 (top products by year)
- Does NOT apply to: Tab 3 inventory (always reflects current warehouse state)

---

## Components & Files

### Modified
- `apps/admin/app/(dashboard)/analytics/page.tsx` — replace flat layout with `<Tabs>` from `@workspace/ui/components/tabs`. Move each section into a `<TabsContent>`. Keep existing data fetch unchanged.

### New
- `apps/admin/components/admin/analytics/low-stock-list.tsx` — fetches and displays top 10 low-stock variants with link to products page
- `apps/admin/components/admin/analytics/out-of-stock-list.tsx` — fetches and displays top 10 out-of-stock variants with link to products page

### New API endpoint
- `GET /api/admin/analytics/stock-alerts` — returns `{ lowStock: Variant[], outOfStock: Variant[] }` where each variant includes `id`, `name`, `sku`, `stockQuantity`, `productName`. Queries `productVariants` joined with `products`. Low stock capped at 10, out of stock capped at 10.

### Unchanged
- `AnalyticsHeader`, `AnalyticsStats`, `RevenueChart`, `CategorySalesChart`, `TopProducts`, `InventoryStats` — no changes to existing components
- `analytics.server.ts` — no changes to existing query

---

## Data Flow

```
analytics/page.tsx
  useQuery(queryKeys.admin.analytics)  → existing endpoint, unchanged
  useQuery(queryKeys.admin.stockAlerts) → new endpoint

  Tab 1: passes data.monthlyRevenue, data.categorySales, data (KPIs)
  Tab 2: passes data.topProducts
  Tab 3: passes data.inventory (stats), stockAlerts (lists)
```

---

## Out of Scope

- Pagination for the stock alert lists (link to products page instead)
- Date range picker (year-only filter is sufficient for now)
- Export per-tab (existing "Tải báo cáo PDF" stays in header, exports overview data)
- Conversion rate tracking (remains mocked)
- Growth % on top products (remains mocked/random)
