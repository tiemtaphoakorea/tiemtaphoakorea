# Phase 3 — Card 2: Line "Doanh thu 30 ngày + Margin tháng"

**Why:** Card này gộp cả `/finance` (margin tháng) lẫn `/finance/detail` (granular ngày) thành 1 visualization tổng — line chart 30 ngày + label margin so với tháng trước.

**Files:**
- Create: `apps/admin/components/admin/analytics/index-card-finance-trend.tsx`

**Depends on:** none (dùng API có sẵn `getDailyFinancialStats` + `getFinancialStats`)

---

## Component contract

Self-contained: tự fetch 3 query qua TanStack Query.

Queries:
1. `adminClient.getDailyFinancialStats({startDate: 30 ngày trước, endDate: today})` → `dailyData[]` (30 dots).
2. `adminClient.getFinancialStats({month: this, year})` → `stats` cho margin tháng hiện tại.
3. `adminClient.getFinancialStats({month: last, year: prev-aware})` → margin tháng trước (để tính delta pt).

Compute:
- `marginThis = thisStats.netProfit / thisStats.revenue * 100`
- `marginLast = lastStats.netProfit / lastStats.revenue * 100`
- `deltaPt = marginThis - marginLast`

Card link → `ADMIN_ROUTES.ANALYTICS_FINANCE`.

---

## Steps

- [ ] **Step 1: Tạo file với scaffold + helper**

Create `apps/admin/components/admin/analytics/index-card-finance-trend.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card } from "@workspace/ui/components/card";
import { ChevronRight, Wallet } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

function getDateRange30d() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29); // 30 ngày inclusive
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getMonthYear(offsetMonths: number) {
  const d = new Date();
  d.setDate(1); // tránh edge-case ngày 31 ở tháng có 30 ngày
  d.setMonth(d.getMonth() + offsetMonths);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function calcMargin(revenue: number, netProfit: number) {
  if (!revenue || revenue <= 0) return 0;
  return (netProfit / revenue) * 100;
}

export function IndexCardFinanceTrend() {
  const range = getDateRange30d();
  const thisMonth = getMonthYear(0);
  const lastMonth = getMonthYear(-1);

  const dailyQuery = useQuery({
    queryKey: queryKeys.admin.finance.daily(range),
    queryFn: () => adminClient.getDailyFinancialStats(range),
    staleTime: 60_000,
  });

  const thisQuery = useQuery({
    queryKey: queryKeys.admin.finance.stats(thisMonth),
    queryFn: () => adminClient.getFinancialStats(thisMonth),
    staleTime: 60_000,
  });

  const lastQuery = useQuery({
    queryKey: queryKeys.admin.finance.stats(lastMonth),
    queryFn: () => adminClient.getFinancialStats(lastMonth),
    staleTime: 60_000,
  });

  const isLoading = dailyQuery.isLoading || thisQuery.isLoading || lastQuery.isLoading;
  const daily = dailyQuery.data?.dailyData ?? [];
  const marginThis = calcMargin(
    thisQuery.data?.stats.revenue ?? 0,
    thisQuery.data?.stats.netProfit ?? 0,
  );
  const marginLast = calcMargin(
    lastQuery.data?.stats.revenue ?? 0,
    lastQuery.data?.stats.netProfit ?? 0,
  );
  const deltaPt = marginThis - marginLast;
  const deltaSign = deltaPt > 0 ? "+" : "";
  const deltaTone = deltaPt > 0 ? "text-emerald-600" : deltaPt < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <Link href={ADMIN_ROUTES.ANALYTICS_FINANCE} className="group">
      <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100">
            <Wallet className="h-5 w-5 text-emerald-600" strokeWidth={2} />
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-[15px] font-bold leading-tight">Tài chính & Doanh thu</div>
          <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            Lợi nhuận và doanh thu 30 ngày qua
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Margin T{thisMonth.month}
                </span>
                <span className="text-lg font-bold tabular-nums text-emerald-700">
                  {marginThis.toFixed(1)}%
                </span>
              </div>
              <span className={`text-[11px] font-semibold tabular-nums ${deltaTone}`}>
                {deltaSign}
                {deltaPt.toFixed(1)}pt vs T{lastMonth.month}
              </span>
            </div>
            <div className="h-20 w-full">
              {daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="financeTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#financeTrendFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  Chưa có dữ liệu 30 ngày
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Verify queryKeys methods exist**

Open `apps/admin/lib/query-keys.ts`. Confirm:
- `queryKeys.admin.finance.daily({startDate, endDate})` exists
- `queryKeys.admin.finance.stats({month, year})` exists

(Đã verify trong context: line 67 và 72 của file đó.)

Nếu key shape khác, adjust cho khớp.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @workspace/admin typecheck`
Expected: PASS. Lỗi thường gặp:
- `getFinancialStats` return type — verify shape `{ stats: FinancialStats }` theo `admin.client.ts:551`.
- `getDailyFinancialStats` return — `{ dailyData, summary }` theo `admin.client.ts:569`.
- `Wallet` icon — có trong `lucide-react`.

- [ ] **Step 4: Lint**

Run: `pnpm --filter @workspace/admin lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/admin/analytics/index-card-finance-trend.tsx
git commit -m "feat(analytics): add IndexCardFinanceTrend line+margin card"
```

---

## Success criteria

- File <200 dòng.
- 3 useQuery độc lập, đúng query keys.
- Loading: 2 skeleton bars.
- Empty (no daily data): show "Chưa có dữ liệu 30 ngày" trong slot chart.
- Margin label format đúng: "Margin T{N}: X.X%" + delta "+Y.Ypt vs T{N-1}" với màu xanh/đỏ/xám.
- AreaChart 30 dots, gradient fill primary.

## Risks

- **Tháng 1 wraparound:** `getMonthYear(-1)` setMonth(0-1=-1) → JS auto-correct sang Dec năm trước. Test mental: today T5/2026 → lastMonth = T4/2026 ✓.
- **`getFinancialStats` consider `paidAt` vs `createdAt`:** service hiện dùng `createdAt where paymentStatus=PAID` — match daily stats. Consistent.
- **Revenue=0 cả 2 tháng:** marginThis=marginLast=0, deltaPt=0 → tone=muted. OK.
