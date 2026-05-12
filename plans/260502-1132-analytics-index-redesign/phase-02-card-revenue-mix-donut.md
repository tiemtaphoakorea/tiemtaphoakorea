# Phase 2 — Card 1: Donut "Cơ cấu doanh thu theo danh mục"

**Why:** Tạo sub-component cho Card 1 thay vì inline trong `_content.tsx` (separation of concerns, file <200 dòng).

**Files:**
- Create: `apps/admin/components/admin/analytics/index-card-revenue-mix.tsx`

**Depends on:** Phase 1 (`AnalyticsCategorySale.revenue`)

---

## Component contract

Props:
```ts
interface IndexCardRevenueMixProps {
  data: AnalyticsCategorySale[] | undefined;
  isLoading: boolean;
}
```

Behavior:
- Nếu `isLoading` → skeleton.
- Nếu `data` empty → empty state "Chưa có dữ liệu danh mục".
- Else: top 3 by revenue + gộp phần còn lại thành "Khác".
- Card wrap toàn bộ trong `<Link href={ADMIN_ROUTES.ANALYTICS_OVERVIEW}>`.

---

## Steps

- [ ] **Step 1: Tạo file với scaffold**

Create `apps/admin/components/admin/analytics/index-card-revenue-mix.tsx`:

```tsx
"use client";

import type { AnalyticsCategorySale } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { BarChart3, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface IndexCardRevenueMixProps {
  data: AnalyticsCategorySale[] | undefined;
  isLoading: boolean;
}

const DONUT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

function buildDonutData(data: AnalyticsCategorySale[]) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const restRevenue = rest.reduce((sum, c) => sum + c.revenue, 0);
  const segments = [...top3];
  if (restRevenue > 0) {
    segments.push({ category: "Khác", sales: 0, revenue: restRevenue });
  }
  const total = segments.reduce((sum, s) => sum + s.revenue, 0);
  return segments.map((s, i) => ({
    ...s,
    color: DONUT_COLORS[i] ?? DONUT_COLORS[3],
    percent: total > 0 ? (s.revenue / total) * 100 : 0,
  }));
}

export function IndexCardRevenueMix({ data, isLoading }: IndexCardRevenueMixProps) {
  const segments = data && data.length > 0 ? buildDonutData(data) : [];
  const isEmpty = !isLoading && segments.length === 0;

  return (
    <Link href={ADMIN_ROUTES.ANALYTICS_OVERVIEW} className="group">
      <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-[15px] font-bold leading-tight">Tổng hợp doanh thu</div>
          <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            Cơ cấu doanh thu theo danh mục
          </div>
        </div>

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : isEmpty ? (
          <div className="grid h-32 place-items-center text-xs text-muted-foreground">
            Chưa có dữ liệu danh mục
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    dataKey="revenue"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {segments.map((s) => (
                      <Cell key={s.category} fill={s.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
              {segments.map((s) => (
                <li key={s.category} className="flex items-center gap-2 text-[12px] leading-tight">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{s.category}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.percent.toFixed(0)}%
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                    {formatCurrency(s.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @workspace/admin typecheck`
Expected: PASS.

Nếu lỗi `formatCurrency`, check import path `@workspace/shared/utils` (xem usage ở `inventory-stats.tsx:2`).
Nếu lỗi `--chart-2/3/4` không được resolve: thay bằng hex/rgb cứng (`#3b82f6`, `#10b981`, `#f59e0b`, `#94a3b8`).

- [ ] **Step 3: Lint**

Run: `pnpm --filter @workspace/admin lint`
Expected: PASS (hoặc warning vô hại).

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/admin/analytics/index-card-revenue-mix.tsx
git commit -m "feat(analytics): add IndexCardRevenueMix donut card"
```

---

## Success criteria

- File <200 dòng.
- Typecheck PASS.
- Component nhận `AnalyticsCategorySale[]` + `isLoading`, render đúng 3 trạng thái (loading/empty/data).
- Donut innerRadius=28 outerRadius=44, 4 segment max, mỗi segment 1 màu.

## Risks

- **`hsl(var(--chart-X))` không resolve:** mitigated trong Step 2 fallback hex.
- **Recharts SSR issue:** component đã `"use client"` nên OK.
