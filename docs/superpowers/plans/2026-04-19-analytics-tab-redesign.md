# Analytics Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the flat `/analytics` page into 3 tabs (Tổng quan, Sản phẩm, Tồn kho) with a new stock-alerts API endpoint and two new inventory list components.

**Architecture:** The existing `analytics/page.tsx` keeps its current `useQuery` for analytics data and gains a second `useQuery` for stock alerts. The flat layout is replaced with `<Tabs>` from `@workspace/ui/components/tabs`. Two new server-fetched list components display low-stock and out-of-stock variants in the Tồn kho tab.

**Tech Stack:** Next.js, TanStack React Query, Drizzle ORM, `@workspace/ui/components/tabs`, Lucide icons

---

## File Map

| Action | File |
|--------|------|
| Modify | `packages/shared/src/api-endpoints.ts` — add `STOCK_ALERTS` constant |
| Modify | `apps/admin/lib/query-keys.ts` — add `admin.stockAlerts` key |
| Modify | `apps/admin/services/admin.client.ts` — add `getStockAlerts()` |
| Create | `apps/admin/app/api/admin/analytics/stock-alerts/route.ts` — GET handler |
| Create | `apps/admin/components/admin/analytics/low-stock-list.tsx` |
| Create | `apps/admin/components/admin/analytics/out-of-stock-list.tsx` |
| Modify | `apps/admin/app/(dashboard)/analytics/page.tsx` — tabs layout |

---

### Task 1: Add API endpoint constant and query key

**Files:**
- Modify: `packages/shared/src/api-endpoints.ts`
- Modify: `apps/admin/lib/query-keys.ts`

- [ ] **Step 1: Add `STOCK_ALERTS` to api-endpoints**

In `packages/shared/src/api-endpoints.ts`, add after the `ANALYTICS` line:

```ts
ANALYTICS: "/api/admin/analytics",
STOCK_ALERTS: "/api/admin/analytics/stock-alerts",
```

- [ ] **Step 2: Add `stockAlerts` to query keys**

In `apps/admin/lib/query-keys.ts`, add inside the `admin` object after the `analytics` key:

```ts
analytics: [QK.adminRoot, QK.analytics] as const,
stockAlerts: [QK.adminRoot, "stock-alerts"] as const,
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/api-endpoints.ts apps/admin/lib/query-keys.ts
git commit -m "feat(analytics): add stock-alerts endpoint constant and query key"
```

---

### Task 2: Add `getStockAlerts()` to admin client

**Files:**
- Modify: `apps/admin/services/admin.client.ts`

- [ ] **Step 1: Add the method**

Find the `getAnalytics` method in `apps/admin/services/admin.client.ts` and add `getStockAlerts` directly after it:

```ts
async getAnalytics() {
  return axios.get<AnalyticsData>(API_ENDPOINTS.ADMIN.ANALYTICS) as unknown as Promise<AnalyticsData>;
},

async getStockAlerts() {
  return axios.get<{ lowStock: StockAlertVariant[]; outOfStock: StockAlertVariant[] }>(
    API_ENDPOINTS.ADMIN.STOCK_ALERTS,
  ) as unknown as Promise<{ lowStock: StockAlertVariant[]; outOfStock: StockAlertVariant[] }>;
},
```

Also add the `StockAlertVariant` type to the imports at the top of the file. Since this type is defined in the new API route, define it inline as a local type alias at the top of the client file (before the `adminClient` object):

```ts
export type StockAlertVariant = {
  id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  productName: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/services/admin.client.ts
git commit -m "feat(analytics): add getStockAlerts to admin client"
```

---

### Task 3: Create the stock-alerts API route

**Files:**
- Create: `apps/admin/app/api/admin/analytics/stock-alerts/route.ts`

- [ ] **Step 1: Create the route file**

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import { db } from "@workspace/database/lib/db";
import { products, productVariants } from "@workspace/database/schema";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { and, asc, gt, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const LOW_STOCK_LIMIT = 10;
const OUT_OF_STOCK_LIMIT = 10;

export async function GET(request: Request) {
  const internalUser = await getInternalUser(request);
  if (!internalUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (![ROLE.OWNER, ROLE.MANAGER].includes(internalUser.profile.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const lowStock = await db
      .select({
        id: productVariants.id,
        name: productVariants.name,
        sku: productVariants.sku,
        stockQuantity: productVariants.stockQuantity,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, sql`${productVariants.productId} = ${products.id}`)
      .where(
        and(
          gt(productVariants.stockQuantity, 0),
          lte(productVariants.stockQuantity, productVariants.lowStockThreshold),
        ),
      )
      .orderBy(asc(productVariants.stockQuantity))
      .limit(LOW_STOCK_LIMIT);

    const outOfStock = await db
      .select({
        id: productVariants.id,
        name: productVariants.name,
        sku: productVariants.sku,
        stockQuantity: productVariants.stockQuantity,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, sql`${productVariants.productId} = ${products.id}`)
      .where(lte(productVariants.stockQuantity, 0))
      .orderBy(asc(products.name))
      .limit(OUT_OF_STOCK_LIMIT);

    return NextResponse.json({ lowStock, outOfStock });
  } catch (error) {
    console.error("Failed to fetch stock alerts:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải dữ liệu tồn kho." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 2: Verify the schema imports**

Check that `products` and `productVariants` can be imported from `@workspace/database/schema`:

```bash
grep -r "export.*products\|export.*productVariants" packages/database/src/schema/index.ts
```

Expected: both names appear in the exports. If they're not re-exported from the index, import directly from `@workspace/database/schema/products`.

- [ ] **Step 3: Check the productId column name**

```bash
grep "productId\|product_id" packages/database/src/schema/products.ts | head -5
```

Adjust the join condition if the column is named differently.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/api/admin/analytics/stock-alerts/route.ts
git commit -m "feat(analytics): add stock-alerts API endpoint"
```

---

### Task 4: Create LowStockList component

**Files:**
- Create: `apps/admin/components/admin/analytics/low-stock-list.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { StockAlertVariant } from "@/services/admin.client";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface LowStockListProps {
  items: StockAlertVariant[];
}

export function LowStockList({ items }: LowStockListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
            Sắp hết hàng
          </h3>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          Xem tất cả <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Không có sản phẩm sắp hết hàng</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {item.productName}
                </p>
                <p className="text-xs text-slate-500">
                  {item.name}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
              </div>
              <span className="ml-4 shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-black text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                {item.stockQuantity} còn lại
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/components/admin/analytics/low-stock-list.tsx
git commit -m "feat(analytics): add LowStockList component"
```

---

### Task 5: Create OutOfStockList component

**Files:**
- Create: `apps/admin/components/admin/analytics/out-of-stock-list.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { StockAlertVariant } from "@/services/admin.client";
import { ArrowUpRight, PackageX } from "lucide-react";
import Link from "next/link";

interface OutOfStockListProps {
  items: StockAlertVariant[];
}

export function OutOfStockList({ items }: OutOfStockListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
            Hết hàng
          </h3>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          Xem tất cả <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Không có sản phẩm hết hàng</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {item.productName}
                </p>
                <p className="text-xs text-slate-500">
                  {item.name}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
              </div>
              <span className="ml-4 shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-black text-red-600 dark:bg-red-900/20 dark:text-red-400">
                Hết hàng
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/components/admin/analytics/out-of-stock-list.tsx
git commit -m "feat(analytics): add OutOfStockList component"
```

---

### Task 6: Restructure analytics page with tabs

**Files:**
- Modify: `apps/admin/app/(dashboard)/analytics/page.tsx`

- [ ] **Step 1: Replace the page content**

Replace the entire file content with:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import dynamic from "next/dynamic";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import { LowStockList } from "@/components/admin/analytics/low-stock-list";
import { OutOfStockList } from "@/components/admin/analytics/out-of-stock-list";
import { TopProducts } from "@/components/admin/analytics/top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  { ssr: false },
);
const CategorySalesChart = dynamic(
  () =>
    import("@/components/admin/analytics/category-sales-chart").then((m) => ({
      default: m.CategorySalesChart,
    })),
  { ssr: false },
);

export default function AdminAnalyticsPage() {
  "use no memo";
  const { data, isLoading, error } = useQuery<AnalyticsData>({
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-destructive text-center font-medium">
          {error instanceof Error ? error.message : "Không có dữ liệu."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <AnalyticsHeader data={data} />

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 flex flex-col gap-8">
          <AnalyticsStats data={data} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <RevenueChart data={data.monthlyRevenue} />
            <CategorySalesChart data={data.categorySales} />
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <TopProducts products={data.topProducts} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6 flex flex-col gap-8">
          {data.inventory && <InventoryStats data={data.inventory} />}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="pt-6">
                {isLoadingStock ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
                      />
                    ))}
                  </div>
                ) : (
                  <LowStockList items={stockAlerts?.lowStock ?? []} />
                )}
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="pt-6">
                {isLoadingStock ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
                      />
                    ))}
                  </div>
                ) : (
                  <OutOfStockList items={stockAlerts?.outOfStock ?? []} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to analytics files. Fix any type errors before committing.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/app/(dashboard)/analytics/page.tsx
git commit -m "feat(analytics): restructure page into 3 tabs (Tổng quan, Sản phẩm, Tồn kho)"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|-------------|------------|
| 3 tabs on `/analytics` URL | Task 6 |
| Global year filter above tabs | `AnalyticsHeader` already renders the year filter — unchanged, stays above `<Tabs>` |
| Tab 1: 4 KPIs + RevenueChart + CategorySalesChart | Task 6, `overview` tab |
| Tab 2: Full top products table | Task 6, `products` tab |
| Tab 3: 5 stat cards (InventoryStats) | Task 6, `inventory` tab |
| Tab 3: Sắp hết hàng list, top 10, link to /products | Tasks 4, 5, 6 |
| Tab 3: Hết hàng list, top 10, link to /products | Tasks 4, 5, 6 |
| New API `GET /api/admin/analytics/stock-alerts` | Task 3 |
| Response shape: `{ lowStock, outOfStock }` each with `id, name, sku, stockQuantity, productName` | Task 3 |
| Low stock: `stockQuantity > 0 AND stockQuantity <= lowStockThreshold`, sorted ascending | Task 3 |
| Out of stock: `stockQuantity <= 0`, sorted by name | Task 3 |
| All existing components unchanged | Plan only modifies `page.tsx` |

### Placeholder scan

None found — all steps contain complete code.

### Type consistency

- `StockAlertVariant` defined in `admin.client.ts` and imported in both list components — consistent.
- `stockAlerts?.lowStock ?? []` and `stockAlerts?.outOfStock ?? []` — safe access, consistent with return type.
