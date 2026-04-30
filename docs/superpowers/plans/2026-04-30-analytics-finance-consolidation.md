# Analytics & Finance Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the `/finance` section into `/analytics` as a sub-route, consolidate dashboard to operational-only widgets, and give every report category its own dedicated page under `/analytics/*`.

**Architecture:** Replace the current tabbed `/analytics` page with a hub page containing 4 summary cards. Each card links to a dedicated sub-page (`/analytics/overview`, `/analytics/products`, `/analytics/inventory`, `/analytics/finance`). The `/finance/*` routes are deleted entirely. Dashboard keeps today-focused KPIs + recent orders + a new debt summary widget.

**Tech Stack:** Next.js App Router, React Query v5, shadcn/ui (Sheet, Drawer from vaul), Tailwind CSS, TypeScript, Drizzle ORM, Biome linter (run `npx biome check --write .` to auto-fix)

---

## File Map

### Create
| File | Purpose |
|---|---|
| `apps/admin/app/api/admin/debts/summary/route.ts` | GET endpoint returning `{ totalDebt, customerCount }` |
| `apps/admin/components/admin/dashboard/dashboard-debt-summary.tsx` | Debt widget for dashboard |
| `apps/admin/components/admin/analytics/analytics-hub-cards.tsx` | 4 summary cards on hub |
| `apps/admin/app/(dashboard)/analytics/overview/page.tsx` | Revenue + category charts |
| `apps/admin/app/(dashboard)/analytics/products/page.tsx` | Top products |
| `apps/admin/app/(dashboard)/analytics/inventory/page.tsx` | Stock levels + alerts |
| `apps/admin/components/admin/analytics/finance-range-picker.tsx` | Preset chips + month/year + custom picker |
| `apps/admin/components/admin/analytics/finance-day-drawer.tsx` | Responsive Sheet/Drawer for daily drilldown |
| `apps/admin/app/(dashboard)/analytics/finance/page.tsx` | P&L page with range picker + breakdown + daily table |

### Modify
| File | Change |
|---|---|
| `packages/shared/src/routes.ts` | Add `ANALYTICS_OVERVIEW/PRODUCTS/INVENTORY/FINANCE`, remove `FINANCE` |
| `packages/shared/src/api-endpoints.ts` | Add `DEBT_SUMMARY` endpoint |
| `packages/database/src/services/debt.server.ts` | Add `getDebtAggregate()` |
| `apps/admin/services/admin.client.ts` | Add `getDebtSummary()`, `getFinancialStatsByRange()` |
| `apps/admin/lib/query-keys.ts` | Add `debtSummary`, `finance.statsByRange` keys |
| `apps/admin/app/(dashboard)/page.tsx` | Swap TopProducts → DebtSummary, remove KPI import |
| `apps/admin/app/(dashboard)/analytics/page.tsx` | Replace tabs with hub layout |
| `apps/admin/components/layout/admin-sidebar.tsx` | Remove Finance entry |
| `apps/admin/components/admin/finance/finance-stats.tsx` | Remove `router.push` to old `/finance/detail` |

### Delete
| File | Reason |
|---|---|
| `apps/admin/app/(dashboard)/finance/` | Entire folder — routes merged into analytics |
| `apps/admin/components/admin/dashboard/dashboard-top-products.tsx` | Duplicate of analytics/products |
| `apps/admin/components/admin/dashboard/dashboard-top-products-skeleton.tsx` | Unused after above |
| `apps/admin/components/admin/dashboard/dashboard-kpis.tsx` | Replaced by existing component (kept but dashboard-kpis stays — see Task 2) |

---

## Task 1: Foundation — Routes, API endpoint, Client methods

**Files:**
- Modify: `packages/shared/src/routes.ts`
- Modify: `packages/shared/src/api-endpoints.ts`
- Modify: `packages/database/src/services/debt.server.ts`
- Create: `apps/admin/app/api/admin/debts/summary/route.ts`
- Modify: `apps/admin/services/admin.client.ts`
- Modify: `apps/admin/lib/query-keys.ts`

- [ ] **Step 1.1: Add analytics sub-routes and remove FINANCE from routes.ts**

In `packages/shared/src/routes.ts`, find the Analytics section and replace:
```ts
// Analytics
ANALYTICS: "/analytics",
```
with:
```ts
// Analytics
ANALYTICS: "/analytics",
ANALYTICS_OVERVIEW: "/analytics/overview",
ANALYTICS_PRODUCTS: "/analytics/products",
ANALYTICS_INVENTORY: "/analytics/inventory",
ANALYTICS_FINANCE: "/analytics/finance",
```

Also remove the Finance entry (keep EXPENSES):
```ts
// DELETE this line:
FINANCE: "/finance",
```

- [ ] **Step 1.2: Add DEBT_SUMMARY to api-endpoints.ts**

In `packages/shared/src/api-endpoints.ts`, find `DEBTS:` and add after it:
```ts
DEBT_SUMMARY: "/api/admin/debts/summary",
```

- [ ] **Step 1.3: Add getDebtAggregate to debt.server.ts**

At the end of `packages/database/src/services/debt.server.ts`, add:
```ts
export async function getDebtAggregate(): Promise<{ totalDebt: number; customerCount: number }> {
  const [row] = await db
    .select({
      totalDebt: sql<string>`coalesce(sum(${orders.total}::numeric - coalesce(${orders.paidAmount}, '0')::numeric), 0)`,
      customerCount: sql<number>`count(distinct ${orders.customerId})`.mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        eq(orders.fulfillmentStatus, FULFILLMENT_STATUS.STOCK_OUT),
        sql`${orders.paymentStatus} != ${PAYMENT_STATUS.PAID}`,
      ),
    );
  return { totalDebt: Number(row?.totalDebt ?? 0), customerCount: row?.customerCount ?? 0 };
}
```

- [ ] **Step 1.4: Create the debt summary API route**

Create `apps/admin/app/api/admin/debts/summary/route.ts`:
```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import { getDebtAggregate } from "@workspace/database/services/debt.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  try {
    const summary = await getDebtAggregate();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch debt aggregate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 1.5: Add client methods to admin.client.ts**

In `apps/admin/services/admin.client.ts`, locate `async getFinancialStats` and add after it:
```ts
async getFinancialStatsByRange(params: { startDate: string; endDate: string }) {
  return axios.get<{ stats: FinancialStats }>(API_ENDPOINTS.ADMIN.FINANCE, {
    params,
  }) as unknown as Promise<{ stats: FinancialStats }>;
},
```

Also add `getDebtSummary` near the other debt methods:
```ts
async getDebtSummary() {
  return axios.get<{ totalDebt: number; customerCount: number }>(
    API_ENDPOINTS.ADMIN.DEBT_SUMMARY,
  ) as unknown as Promise<{ totalDebt: number; customerCount: number }>;
},
```

- [ ] **Step 1.6: Add query keys**

In `apps/admin/lib/query-keys.ts`:

In the `dashboard` section add `debtSummary`:
```ts
dashboard: {
  kpi: [QK.adminRoot, "dashboard-kpi"] as const,
  debtSummary: [QK.adminRoot, "debt-summary"] as const,  // ADD
  // ...existing keys
},
```

In the `finance` section add `statsByRange`:
```ts
finance: {
  all: [QK.adminRoot, QK.finance] as const,
  stats: (date: { month: number; year: number }) =>
    [QK.adminRoot, QK.finance, QK.financeStatsLeaf, date] as const,
  statsByRange: (params: { startDate: string; endDate: string }) =>  // ADD
    [QK.adminRoot, QK.finance, QK.financeStatsLeaf, params] as const,
  daily: (params: { startDate: string; endDate: string }) =>
    [QK.adminRoot, QK.finance, "daily", params] as const,
  dayOrders: (date: string) => [QK.adminRoot, QK.finance, "day-orders", date] as const,
},
```

- [ ] **Step 1.7: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../.. && git add packages/shared/src/routes.ts packages/shared/src/api-endpoints.ts packages/database/src/services/debt.server.ts apps/admin/app/api/admin/debts/summary/route.ts apps/admin/services/admin.client.ts apps/admin/lib/query-keys.ts
git commit -m "feat(analytics): add foundation routes, debt summary API, and finance range client method"
```

---

## Task 2: Dashboard Refactor

**Files:**
- Create: `apps/admin/components/admin/dashboard/dashboard-debt-summary.tsx`
- Modify: `apps/admin/app/(dashboard)/page.tsx`
- Delete: `apps/admin/components/admin/dashboard/dashboard-top-products.tsx`
- Delete: `apps/admin/components/admin/dashboard/dashboard-top-products-skeleton.tsx`

- [ ] **Step 2.1: Create DashboardDebtSummary component**

Create `apps/admin/components/admin/dashboard/dashboard-debt-summary.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function DashboardDebtSummary() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.debtSummary,
    queryFn: () => adminClient.getDebtSummary(),
  });

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
          Công nợ cần thu
        </CardTitle>
        <AlertCircle className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-36 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-black text-amber-600">
              {formatCurrency(data?.totalDebt ?? 0)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs font-medium">
              {data?.customerCount ?? 0} khách hàng chưa thanh toán
            </p>
          </>
        )}
        <Link
          href={ADMIN_ROUTES.DEBTS}
          className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2.2: Update dashboard page**

Replace the content of `apps/admin/app/(dashboard)/page.tsx` with:
```tsx
"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { BarChart3, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardKPIsSkeleton } from "@/components/admin/dashboard/dashboard-kpis-skeleton";
import { DashboardRecentOrdersSkeleton } from "@/components/admin/dashboard/dashboard-recent-orders-skeleton";
import { DashboardDebtSummary } from "@/components/admin/dashboard/dashboard-debt-summary";

const DashboardKPIs = dynamic(
  () =>
    import("@/components/admin/dashboard/dashboard-kpis").then((m) => ({
      default: m.DashboardKPIs,
    })),
  { ssr: false, loading: () => <DashboardKPIsSkeleton /> },
);
const DashboardRecentOrders = dynamic(
  () =>
    import("@/components/admin/dashboard/dashboard-recent-orders").then((m) => ({
      default: m.DashboardRecentOrders,
    })),
  { ssr: false, loading: () => <DashboardRecentOrdersSkeleton /> },
);

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Trung tâm điều hành
          </h1>
          <p className="text-muted-foreground font-medium">
            Tình hình kinh doanh{" "}
            <span className="text-primary font-bold">
              hôm nay, {new Date().toLocaleDateString("vi-VN")}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-slate-200 font-bold dark:border-slate-800"
            asChild
          >
            <Link href={ADMIN_ROUTES.PRODUCTS}>Quản lý kho</Link>
          </Button>
          <Button className="shadow-primary/20 h-11 gap-2 rounded-xl font-black shadow-lg" asChild>
            <Link href={ADMIN_ROUTES.PRODUCTS_ADD}>
              <Plus className="h-5 w-5" />
              Sản phẩm mới
            </Link>
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<DashboardKPIsSkeleton />}>
          <DashboardKPIs />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <Suspense fallback={<DashboardRecentOrdersSkeleton />}>
              <DashboardRecentOrders />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="flex flex-col gap-4">
          <DashboardDebtSummary />
          <Link
            href={ADMIN_ROUTES.ANALYTICS}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <BarChart3 className="h-4 w-4" />
            Xem báo cáo đầy đủ
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.3: Delete top products files**

```bash
rm apps/admin/components/admin/dashboard/dashboard-top-products.tsx
rm apps/admin/components/admin/dashboard/dashboard-top-products-skeleton.tsx
```

- [ ] **Step 2.4: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../..
git add apps/admin/app/\(dashboard\)/page.tsx apps/admin/components/admin/dashboard/dashboard-debt-summary.tsx
git rm apps/admin/components/admin/dashboard/dashboard-top-products.tsx apps/admin/components/admin/dashboard/dashboard-top-products-skeleton.tsx
git commit -m "feat(dashboard): replace top products with debt summary widget"
```

- [ ] **Step 2.5: Verify in dev server**

Open `/` in browser. Confirm: 4 KPI cards visible, recent orders visible, debt summary card in right column, "Xem báo cáo" link present, no top products section.

---

## Task 3: Analytics Hub Page

**Files:**
- Create: `apps/admin/components/admin/analytics/analytics-hub-cards.tsx`
- Modify: `apps/admin/app/(dashboard)/analytics/page.tsx`

- [ ] **Step 3.1: Create AnalyticsHubCards component**

Create `apps/admin/components/admin/analytics/analytics-hub-cards.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import { BarChart3, ChevronRight, Package, TrendingUp, Warehouse } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function AnalyticsHubCards() {
  const { data: kpi } = useQuery({
    queryKey: queryKeys.dashboard.kpi,
    queryFn: () => adminClient.getDashboardKPIs(),
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  const now = new Date();
  const { data: finance } = useQuery({
    queryKey: queryKeys.admin.finance.stats({ month: now.getMonth() + 1, year: now.getFullYear() }),
    queryFn: () =>
      adminClient.getFinancialStats({ month: now.getMonth() + 1, year: now.getFullYear() }),
  });

  const topProduct = analytics?.topProducts?.[0];
  const stockAlertCount = (kpi?.kpiStats?.outOfStockCount ?? 0) + (kpi?.kpiStats?.lowStockCount ?? 0);
  const netProfit = finance?.stats?.netProfit ?? 0;
  const revenue = finance?.stats?.revenue ?? 0;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

  const cards = [
    {
      href: ADMIN_ROUTES.ANALYTICS_OVERVIEW,
      icon: BarChart3,
      label: "Tổng quan",
      headline: formatCurrency(kpi?.kpiStats?.todayRevenue ?? 0),
      sub: "Doanh thu hôm nay",
      color: "text-blue-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_PRODUCTS,
      icon: Package,
      label: "Sản phẩm",
      headline: topProduct?.name ?? "—",
      sub: topProduct ? `${topProduct.totalQuantity} đã bán (7 ngày)` : "Chưa có dữ liệu",
      color: "text-violet-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_INVENTORY,
      icon: Warehouse,
      label: "Tồn kho",
      headline: `${stockAlertCount} SP`,
      sub: stockAlertCount > 0 ? "Sắp hết hoặc đã hết hàng" : "Tồn kho ổn định",
      color: stockAlertCount > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_FINANCE,
      icon: TrendingUp,
      label: "Tài chính",
      headline: formatCurrency(netProfit),
      sub: `LN ròng tháng này · ${margin}% margin`,
      color: netProfit >= 0 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ href, icon: Icon, label, headline, sub, color }) => (
        <Link key={href} href={href} className="group block">
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 transition-shadow group-hover:shadow-md dark:ring-slate-800">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <div className={`truncate text-xl font-black ${color}`}>{headline}</div>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{sub}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3.2: Replace analytics hub page**

Replace `apps/admin/app/(dashboard)/analytics/page.tsx` with:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import dynamic from "next/dynamic";
import { AnalyticsHubCards } from "@/components/admin/analytics/analytics-hub-cards";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({
      default: m.RevenueChart,
    })),
  { ssr: false },
);

export default function AdminAnalyticsPage() {
  "use no memo";
  const { data } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Báo cáo & Thống kê
        </h1>
        <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
          Tổng quan hoạt động kinh doanh
        </p>
      </div>

      <AnalyticsHubCards />

      {data?.monthlyRevenue && (
        <div className="grid grid-cols-1">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3.3: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../..
git add apps/admin/app/\(dashboard\)/analytics/page.tsx apps/admin/components/admin/analytics/analytics-hub-cards.tsx
git commit -m "feat(analytics): replace tabbed analytics with hub card layout"
```

- [ ] **Step 3.4: Verify in dev server**

Open `/analytics`. Confirm: 4 summary cards visible with correct data, revenue chart below, cards are tappable links, no tabs.

---

## Task 4: Analytics Sub-pages (Overview, Products, Inventory)

**Files:**
- Create: `apps/admin/app/(dashboard)/analytics/overview/page.tsx`
- Create: `apps/admin/app/(dashboard)/analytics/products/page.tsx`
- Create: `apps/admin/app/(dashboard)/analytics/inventory/page.tsx`

- [ ] **Step 4.1: Create Overview page**

Create `apps/admin/app/(dashboard)/analytics/overview/page.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({
      default: m.RevenueChart,
    })),
  { ssr: false },
);
const CategorySalesChart = dynamic(
  () =>
    import("@/components/admin/analytics/category-sales-chart").then((m) => ({
      default: m.CategorySalesChart,
    })),
  { ssr: false },
);

export default function AnalyticsOverviewPage() {
  "use no memo";
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 lg:col-span-2 dark:bg-slate-700" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-center font-medium text-destructive">
          {error instanceof Error ? error.message : "Không có dữ liệu."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
      </div>
      <AnalyticsHeader data={data} />
      <AnalyticsStats data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueChart data={data.monthlyRevenue} />
        <CategorySalesChart data={data.categorySales} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Create Products page**

Create `apps/admin/app/(dashboard)/analytics/products/page.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { TopProducts } from "@/components/admin/analytics/top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AnalyticsProductsPage() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Sản phẩm bán chạy
            </h1>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <TopProducts products={data?.topProducts ?? []} />
      )}
    </div>
  );
}
```

- [ ] **Step 4.3: Create Inventory page**

Create `apps/admin/app/(dashboard)/analytics/inventory/page.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import Link from "next/link";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import { LowStockList } from "@/components/admin/analytics/low-stock-list";
import { OutOfStockList } from "@/components/admin/analytics/out-of-stock-list";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AnalyticsInventoryPage() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  const { data: stockAlerts, isLoading: isLoadingStock } = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
  });

  const stockLoading = isLoading || isLoadingStock;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Tồn kho
          </h1>
        </div>
      </div>
      {data?.inventory && <InventoryStats data={data.inventory} />}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
                ))}
              </div>
            ) : (
              <LowStockList items={stockAlerts?.lowStock ?? []} />
            )}
          </CardContent>
        </Card>
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
                ))}
              </div>
            ) : (
              <OutOfStockList items={stockAlerts?.outOfStock ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.4: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../..
git add apps/admin/app/\(dashboard\)/analytics/overview/page.tsx apps/admin/app/\(dashboard\)/analytics/products/page.tsx apps/admin/app/\(dashboard\)/analytics/inventory/page.tsx
git commit -m "feat(analytics): add overview, products, inventory sub-pages"
```

- [ ] **Step 4.5: Verify in dev server**

Visit `/analytics/overview`, `/analytics/products`, `/analytics/inventory`. Confirm each shows correct content and "← Báo cáo" back button navigates to `/analytics`.

---

## Task 5: Finance Components

**Files:**
- Create: `apps/admin/components/admin/analytics/finance-range-picker.tsx`
- Create: `apps/admin/components/admin/analytics/finance-day-drawer.tsx`
- Modify: `apps/admin/components/admin/finance/finance-stats.tsx`

- [ ] **Step 5.1: Create FinanceRangePicker**

Create `apps/admin/components/admin/analytics/finance-range-picker.tsx`:
```tsx
"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useState } from "react";

export type DateRange = { startDate: string; endDate: string };

type Preset = "today" | "yesterday" | "7days" | "thisMonth" | "lastMonth" | "month" | "custom";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetToRange(preset: Preset, monthYear?: { month: number; year: number }): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { startDate: toISO(now), endDate: toISO(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { startDate: toISO(y), endDate: toISO(y) };
    }
    case "7days": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: toISO(s), endDate: toISO(now) };
    }
    case "thisMonth":
      return {
        startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: toISO(now),
      };
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toISO(first), endDate: toISO(last) };
    }
    case "month": {
      const m = monthYear?.month ?? now.getMonth() + 1;
      const y = monthYear?.year ?? now.getFullYear();
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      return { startDate: toISO(first), endDate: toISO(last) };
    }
    default:
      return { startDate: toISO(now), endDate: toISO(now) };
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "yesterday", label: "Hôm qua" },
  { key: "7days", label: "7 ngày" },
  { key: "thisMonth", label: "Tháng này" },
  { key: "lastMonth", label: "Tháng trước" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const YEARS = [2024, 2025, 2026];

interface FinanceRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function FinanceRangePicker({ value, onChange }: FinanceRangePickerProps) {
  const now = new Date();
  const [activePreset, setActivePreset] = useState<Preset>("thisMonth");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState(value.startDate);
  const [customTo, setCustomTo] = useState(value.endDate);

  function selectPreset(preset: Preset) {
    setActivePreset(preset);
    if (preset !== "month" && preset !== "custom") {
      onChange(presetToRange(preset));
    }
  }

  function applyMonth() {
    setActivePreset("month");
    onChange(presetToRange("month", { month, year }));
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      setActivePreset("custom");
      onChange({ startDate: customFrom, endDate: customTo });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectPreset(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
              activePreset === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(month)}
          onValueChange={(v) => setMonth(Number(v))}
        >
          <SelectTrigger className="h-8 w-32 text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
        >
          <SelectTrigger className="h-8 w-24 text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={applyMonth}>
          Xem tháng
        </Button>
      </div>

      {/* Custom range */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="h-8 w-36 text-xs"
        />
        <span className="text-xs text-slate-500">→</span>
        <Input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="h-8 w-36 text-xs"
        />
        <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={applyCustom}>
          Áp dụng
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Create FinanceDayDrawer**

Create `apps/admin/components/admin/analytics/finance-day-drawer.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface FinanceDayDrawerProps {
  date: string | null;
  onClose: () => void;
}

export function FinanceDayDrawer({ date, onClose }: FinanceDayDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.finance.dayOrders(date ?? ""),
    queryFn: () => adminClient.getDayOrders(date!),
    enabled: !!date,
  });

  const formattedDate = date
    ? new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <Sheet open={!!date} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[640px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-black capitalize">{formattedDate}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !data?.orders?.length ? (
          <p className="py-8 text-center text-sm text-slate-500">Không có đơn hàng ngày này.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {data.orders.length} đơn hàng
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(data.orders.reduce((s, o) => s + Number(o.total ?? 0), 0))}
              </span>
            </div>
            {data.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500">{order.customerName}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-black">{formatCurrency(Number(order.total ?? 0))}</span>
                  {order.paymentMethod && (
                    <Badge variant="secondary" className="text-[10px]">
                      {order.paymentMethod}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

Note: `DayOrderRow` type from `@workspace/database/services/finance.server` — check the actual field names (`orderNumber`, `customerName`, `total`, `paymentMethod`) against the type definition and adjust if different.

- [ ] **Step 5.3: Remove old router.push from finance-stats.tsx**

In `apps/admin/components/admin/finance/finance-stats.tsx`, find and remove the button that navigates to the old route. Locate:
```tsx
<Button
  className="shadow-primary/20 hover:shadow-primary/30 h-12 w-full rounded-xl font-bold shadow-lg transition-all"
  onClick={() => router.push(`/finance/detail?month=${date.month}&year=${date.year}`)}
>
  Xem báo cáo chi tiết
</Button>
```
Delete that `<Button>` block entirely.

Also remove the `useRouter` import and call since it's no longer used:
- Remove: `import { useRouter } from "next/navigation";`
- Remove: `const router = useRouter();`

- [ ] **Step 5.4: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../..
git add apps/admin/components/admin/analytics/finance-range-picker.tsx apps/admin/components/admin/analytics/finance-day-drawer.tsx apps/admin/components/admin/finance/finance-stats.tsx
git commit -m "feat(analytics): add finance range picker and day drawer components"
```

---

## Task 6: Analytics Finance Page

**Files:**
- Create: `apps/admin/app/(dashboard)/analytics/finance/page.tsx`

- [ ] **Step 6.1: Check DayOrderRow type fields**

Before writing the page, verify actual field names on `DayOrderRow`:
```bash
grep -n "DayOrderRow\|orderNumber\|customerName\|paymentMethod" packages/database/src/services/finance.server.ts | head -20
```
Note down the field names. Update `finance-day-drawer.tsx` in Step 5.2 if they differ.

- [ ] **Step 6.2: Create the finance page**

Create `apps/admin/app/(dashboard)/analytics/finance/page.tsx`:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FinanceDayDrawer } from "@/components/admin/analytics/finance-day-drawer";
import { FinanceRangePicker, type DateRange } from "@/components/admin/analytics/finance-range-picker";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const FinanceStats = dynamic(
  () =>
    import("@/components/admin/finance/finance-stats").then((m) => ({ default: m.FinanceStats })),
  { ssr: false },
);

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toISO(now),
  };
}

export default function AnalyticsFinancePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRange: DateRange = {
    startDate: searchParams.get("from") ?? getThisMonthRange().startDate,
    endDate: searchParams.get("to") ?? getThisMonthRange().endDate,
  };
  const initialDay = searchParams.get("day") ?? null;

  const [range, setRange] = useState<DateRange>(initialRange);
  const [openDay, setOpenDay] = useState<string | null>(initialDay);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("from", range.startDate);
    params.set("to", range.endDate);
    if (openDay) params.set("day", openDay);
    router.replace(`${ADMIN_ROUTES.ANALYTICS_FINANCE}?${params.toString()}`, { scroll: false });
  }, [range, openDay, router]);

  function handleRangeChange(newRange: DateRange) {
    setRange(newRange);
    setOpenDay(null);
  }

  const isSingleDay = range.startDate === range.endDate;

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: queryKeys.admin.finance.daily(range),
    queryFn: () => adminClient.getDailyFinancialStats(range),
    enabled: !isSingleDay,
  });

  // FinanceStats uses its own query internally (month/year), but for range-based view
  // we pass a "fake" month/year derived from startDate so the component can work.
  // The component will use these to call getFinancialStats internally.
  const rangeStartDate = new Date(range.startDate);
  const financeDate = {
    month: rangeStartDate.getMonth() + 1,
    year: rangeStartDate.getFullYear(),
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Tài chính & Lợi nhuận
          </h1>
        </div>
      </div>

      <FinanceRangePicker value={range} onChange={handleRangeChange} />

      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />}>
          <FinanceStats date={financeDate} />
        </Suspense>
      </ErrorBoundary>

      {!isSingleDay && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-black tracking-wide text-slate-700 uppercase dark:text-slate-300">
            Chi tiết theo ngày
          </h2>
          {isDailyLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
              ))}
            </div>
          ) : !dailyData?.dailyData?.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              Không có giao dịch trong khoảng này.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl ring-1 ring-slate-200 md:block dark:ring-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {["Ngày", "Doanh thu", "COGS", "LN gộp", "Đơn hàng", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-black tracking-wider text-slate-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...dailyData.dailyData].reverse().map((row) => (
                      <tr
                        key={row.date}
                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => setOpenDay(row.date)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                          {new Date(row.date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-600">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-500">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className={`px-4 py-3 font-bold ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{row.orderCount}</td>
                        <td className="px-4 py-3 text-right text-slate-400">→</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-2 md:hidden">
                {[...dailyData.dailyData].reverse().map((row) => (
                  <button
                    key={row.date}
                    type="button"
                    onClick={() => setOpenDay(row.date)}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(row.date).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="text-xs text-slate-500">{row.orderCount} đơn</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-black text-blue-600">
                        {formatCurrency(row.revenue)}
                      </span>
                      <span className={`text-xs font-bold ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        LN {formatCurrency(row.grossProfit)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <FinanceDayDrawer
        date={openDay}
        onClose={() => setOpenDay(null)}
      />
    </div>
  );
}
```

**Important caveat:** The `FinanceStats` component currently accepts `{ date: { month, year } }` which drives a monthly query internally. For range-based P&L (e.g. "7 ngày"), the `FinanceStats` component only handles month-level data. Two options:

A. For non-month presets, call `adminClient.getFinancialStatsByRange` separately and render the KPI cards + breakdown manually (not using `FinanceStats`).

B. Accept that P&L cards always show the whole month of the `startDate` for now, and display a note "Hiển thị P&L tháng X/Y". This is a simpler scope.

**Recommendation:** Go with option B in the first iteration. The full range-aware P&L can be a follow-up. Document this in a comment on the page.

- [ ] **Step 6.3: Run lint and commit**

```bash
cd apps/admin && npx biome check --write .
cd ../..
git add apps/admin/app/\(dashboard\)/analytics/finance/page.tsx
git commit -m "feat(analytics): add finance page with range picker and daily table"
```

- [ ] **Step 6.4: Verify in dev server**

Visit `/analytics/finance`. Confirm:
- Range picker chips visible and functional
- P&L cards load
- Daily table visible when range > 1 day
- Tap a row → Drawer opens with day's orders
- URL updates with `?from=&to=&day=` params
- Back button navigates to `/analytics`
- Layout responsive on mobile (card list visible on narrow viewport)

---

## Task 7: Sidebar & Cleanup

**Files:**
- Modify: `apps/admin/components/layout/admin-sidebar.tsx`
- Delete: `apps/admin/app/(dashboard)/finance/` (entire folder)

- [ ] **Step 7.1: Remove Finance from sidebar**

In `apps/admin/components/layout/admin-sidebar.tsx`, find and remove the Finance nav item:
```ts
// DELETE this line:
{ icon: PieChart, label: "Tài chính", href: ADMIN_ROUTES.FINANCE },
```

Also remove the `PieChart` icon import if it's only used by the Finance item:
```ts
// In the lucide-react import, remove PieChart if unused:
import { ..., PieChart, ... } from "lucide-react";
// → remove PieChart from the list
```

Also update the role-guard block that references `ADMIN_ROUTES.FINANCE`:
```ts
// Find this block:
if (item.href === ADMIN_ROUTES.FINANCE || item.href === ADMIN_ROUTES.EXPENSES) {
  // ...
}
// Change to:
if (item.href === ADMIN_ROUTES.EXPENSES) {
  // ...
}
```

- [ ] **Step 7.2: Delete old finance pages**

```bash
git rm -r apps/admin/app/\(dashboard\)/finance/
```

This removes:
- `apps/admin/app/(dashboard)/finance/page.tsx`
- `apps/admin/app/(dashboard)/finance/detail/page.tsx`
- `apps/admin/app/(dashboard)/finance/detail/[date]/page.tsx` (untracked — use `rm -rf` if git rm misses it)

```bash
rm -rf apps/admin/app/\(dashboard\)/finance/
```

- [ ] **Step 7.3: Run lint and confirm no broken imports**

```bash
cd apps/admin && npx biome check --write . && grep -r "ADMIN_ROUTES\.FINANCE\b" . --include="*.ts" --include="*.tsx" | grep -v "node_modules\|\.next"
```

The grep should return no results. If it does, fix each reference by replacing `ADMIN_ROUTES.FINANCE` with `ADMIN_ROUTES.ANALYTICS_FINANCE`.

- [ ] **Step 7.4: Final commit**

```bash
cd ../..
git add apps/admin/components/layout/admin-sidebar.tsx
git commit -m "feat(analytics): remove Finance sidebar entry and delete old finance routes"
```

- [ ] **Step 7.5: Full end-to-end verification**

1. `/` — Dashboard: 4 KPI cards, recent orders, debt widget, "Xem báo cáo" link. No top products.
2. `/analytics` — Hub: 4 summary cards, revenue chart. No tabs.
3. `/analytics/overview` — Charts + stats + PDF export. Back button works.
4. `/analytics/products` — Top products list. Back button works.
5. `/analytics/inventory` — Stock stats + alerts. Back button works.
6. `/analytics/finance` — Range picker, P&L, daily table, day drawer. URL syncs.
7. `/finance` — Should 404 (route deleted). Confirm in browser.
8. Sidebar — "Tài chính" item gone. "Báo cáo" remains.
9. Mobile — Open DevTools, set viewport to 375px. Check all pages layout correctly.
