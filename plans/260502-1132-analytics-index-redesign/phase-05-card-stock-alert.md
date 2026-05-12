# Phase 5 — Card 4: Tồn kho cảnh báo

**Why:** Sub-component cho Card 4. Show số tổng cảnh báo + 2 SP nóng nhất — khác sub-page `/inventory` show full list.

**Files:**
- Create: `apps/admin/components/admin/analytics/index-card-stock-alert.tsx`

**Depends on:** none (tự fetch `getStockAlerts`).

---

## Component contract

Self-contained: tự fetch `adminClient.getStockAlerts()` qua TanStack Query.

Behavior:
- `outOfStock` ưu tiên trước (đỏ), sau đó `lowStock` sort by `onHand` asc (nguy hiểm trước).
- Lấy 2 item đầu để hiển thị.
- Tổng cảnh báo = `outOfStock.length + lowStock.length`.
- Card link → `ADMIN_ROUTES.ANALYTICS_INVENTORY`.
- Empty (totalAlerts=0): "Tồn kho ổn định" tone xanh.

---

## Steps

- [ ] **Step 1: Tạo file**

Create `apps/admin/components/admin/analytics/index-card-stock-alert.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card } from "@workspace/ui/components/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type AlertItem = {
  id: string;
  productName: string;
  variantName: string | null;
  onHand: number;
  status: "out" | "low";
};

export function IndexCardStockAlert() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
    staleTime: 60_000,
  });

  const outOfStock = data?.outOfStock ?? [];
  const lowStock = [...(data?.lowStock ?? [])].sort((a, b) => a.onHand - b.onHand);
  const totalAlerts = outOfStock.length + lowStock.length;

  const items: AlertItem[] = [
    ...outOfStock.map((v) => ({
      id: v.id,
      productName: v.productName,
      variantName: v.name,
      onHand: v.onHand,
      status: "out" as const,
    })),
    ...lowStock.map((v) => ({
      id: v.id,
      productName: v.productName,
      variantName: v.name,
      onHand: v.onHand,
      status: "low" as const,
    })),
  ];
  const top2 = items.slice(0, 2);
  const remaining = Math.max(0, totalAlerts - top2.length);
  const isHealthy = !isLoading && totalAlerts === 0;

  return (
    <Link href={ADMIN_ROUTES.ANALYTICS_INVENTORY} className="group">
      <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              isHealthy ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isHealthy ? "text-emerald-600" : "text-amber-600"}`}
              strokeWidth={2}
            />
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-[15px] font-bold leading-tight">Tồn kho cảnh báo</div>
          <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            Sản phẩm sắp hết hoặc đã hết hàng
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <div className="h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="h-5 animate-pulse rounded bg-muted" />
            <div className="h-5 animate-pulse rounded bg-muted" />
          </div>
        ) : isHealthy ? (
          <div className="flex flex-col gap-1">
            <span className="text-[20px] font-bold leading-none text-emerald-700">An toàn</span>
            <span className="text-xs text-muted-foreground">Không có SP nào cần xử lý</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[20px] font-bold leading-none text-amber-700">
              {totalAlerts} SP cần xử lý
            </span>
            <ul className="flex flex-col gap-1.5">
              {top2.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[12px] leading-tight">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      item.status === "out" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium" title={item.productName}>
                    {item.productName}
                    {item.variantName ? ` · ${item.variantName}` : ""}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                      item.status === "out" ? "text-red-600" : "text-amber-700"
                    }`}
                  >
                    {item.status === "out" ? "đã hết" : `còn ${item.onHand}`}
                  </span>
                </li>
              ))}
            </ul>
            {remaining > 0 ? (
              <span className="text-[11px] text-muted-foreground">+ {remaining} SP khác</span>
            ) : null}
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

Lỗi có thể: `getStockAlerts()` return type — verify shape `{ lowStock: StockAlertVariant[], outOfStock: StockAlertVariant[] }` từ `analytics.server.ts:162`. Đã match.

- [ ] **Step 3: Lint**

Run: `pnpm --filter @workspace/admin lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/admin/analytics/index-card-stock-alert.tsx
git commit -m "feat(analytics): add IndexCardStockAlert card"
```

---

## Success criteria

- File <200 dòng.
- 3 trạng thái: loading / healthy (totalAlerts=0) / alert.
- `outOfStock` luôn xếp trước `lowStock`.
- `lowStock` sort theo `onHand` asc.
- Hiển thị tối đa 2 items + "+ N SP khác".
- Color tone: emerald khi healthy, amber default, red cho out-of-stock dot.

## Risks

- **`variantName` (StockAlertVariant.name) có thể null:** mitigated với `${item.variantName ? \` · ${item.variantName}\` : ""}`.
- **Tồn kho rất nhiều cảnh báo:** API limit 10 mỗi list (tổng tối đa 20) — totalAlerts hiển thị sẽ bị capped ở 20. Chấp nhận vì đó là hiển thị "nóng" không phải con số tuyệt đối; user vào sub-page để xem chính xác. Nếu cần con số chính xác, sau này extend API thêm `lowStockCount` / `outOfStockCount` (đã có sẵn trong `getDashboardKPIs`) — out of scope phase này.
