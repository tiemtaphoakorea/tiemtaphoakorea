# Phase 6 — Integrate & Cleanup

**Why:** Wire 4 sub-components vào `_content.tsx`, xoá code cũ (REPORT_CARDS, MONTHLY chart, BarChartMini import) + xoá orphan file `analytics-hub-cards.tsx`. Verify end-to-end.

**Files:**
- Modify: `apps/admin/app/(dashboard)/analytics/_content.tsx` (rewrite)
- Delete: `apps/admin/components/admin/analytics/analytics-hub-cards.tsx` (orphan)

**Depends on:** Phase 1, 2, 3, 4, 5

---

## Steps

- [ ] **Step 1: Rewrite `_content.tsx`**

Replace toàn bộ file `apps/admin/app/(dashboard)/analytics/_content.tsx` bằng:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { IndexCardFinanceTrend } from "@/components/admin/analytics/index-card-finance-trend";
import { IndexCardRevenueMix } from "@/components/admin/analytics/index-card-revenue-mix";
import { IndexCardStockAlert } from "@/components/admin/analytics/index-card-stock-alert";
import { IndexCardTopProducts } from "@/components/admin/analytics/index-card-top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AdminAnalytics() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
    staleTime: 60_000,
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <IndexCardRevenueMix data={data?.categorySales} isLoading={isLoading} />
      <IndexCardFinanceTrend />
      <IndexCardTopProducts data={data?.topProducts} isLoading={isLoading} />
      <IndexCardStockAlert />
    </div>
  );
}
```

Loại bỏ:
- `REPORT_CARDS` array.
- `MONTHLY` constant.
- Import `BarChartMini`, `TonePill`, `lucide-react` icons không còn dùng, `Card`, `Link`, `ADMIN_ROUTES` (giờ không dùng trực tiếp ở file này — sub-components tự xử lý).
- "Doanh thu 5 tháng gần nhất" Card section.

Layout: 2 cols × 2 rows trên desktop (md+), 1 col mobile. Không cần `lg:grid-cols-3` nữa vì chỉ có 4 cards.

- [ ] **Step 2: Delete orphan `analytics-hub-cards.tsx`**

Run:
```bash
git rm apps/admin/components/admin/analytics/analytics-hub-cards.tsx
```

(Đã verify ở Phase 0: file này không có reference nào trong `apps/`/`packages/`.)

- [ ] **Step 3: Typecheck full workspace**

Run:
```bash
pnpm --filter @workspace/admin typecheck
```

Expected: PASS, không error.

- [ ] **Step 4: Lint admin**

Run:
```bash
pnpm --filter @workspace/admin lint
```

Expected: PASS hoặc warning vô hại. Auto-fix nếu cần:
```bash
pnpm --filter @workspace/admin lint:fix
```

- [ ] **Step 5: Visual verification**

Start dev server (background hoặc manual):
```bash
pnpm --filter @workspace/admin dev
```

Mở `http://localhost:3001/analytics`. Kiểm tra:
- 4 cards hiển thị 2x2 grid trên desktop.
- Card 1 (Tổng hợp doanh thu) — donut + legend top 3 + "Khác", màu phân biệt.
- Card 2 (Tài chính & Doanh thu) — line chart 30 ngày + label margin "T{N}: X.X%" + delta pt vs tháng trước.
- Card 3 (Sản phẩm bán chạy) — top 3 SP với progress bar tím + share %.
- Card 4 (Tồn kho cảnh báo) — số tổng + 2 SP nóng nhất (hoặc "An toàn" nếu không có).
- Hover từng card → translate-y-0.5, shadow tăng, ChevronRight dịch sang phải.
- Click card 1 → `/analytics/overview`.
- Click card 2 → `/analytics/finance`.
- Click card 3 → `/analytics/products`.
- Click card 4 → `/analytics/inventory`.

Loading state: refresh trang, 4 cards đều có skeleton tương ứng (không bị empty content).

- [ ] **Step 6: So sánh với dashboard `/`**

Mở 2 tab: `/` và `/analytics`. Confirm:
- Dashboard show: 4 KPI hôm nay, chart 7 ngày, top 5 SP table, đơn gần đây.
- Analytics show: 4 cards period-based (cơ cấu, finance trend, top 3, stock alert).
- Không lặp số liệu/visual giữa 2 trang.

- [ ] **Step 7: So sánh với sub-pages**

Click vào từng card, verify sub-page show **đầy đủ chi tiết** (không bị duplicate hẳn card index):
- `/overview` — full CategorySalesChart + AnalyticsStats + RevenueChart 12 tháng.
- `/finance` — FinanceStats breakdown 1 tháng (DT/COGS/Profit/Margin).
- `/finance/detail` — bảng table per ngày + drawer đơn (truy cập qua button trong `/finance`).
- `/products` — full TopProducts list 8+ SP.
- `/inventory` — InventoryStats + LowStockList + OutOfStockList đầy đủ.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/app/\(dashboard\)/analytics/_content.tsx
git commit -m "feat(analytics): rewrite index page with 4 mini-viz cards

- Replace 6 duplicate-data cards with 4 unique mini-viz cards.
- Remove orphan analytics-hub-cards.tsx.
- Each card maps 1-1 to sub-page, shows non-duplicating preview.
- Drop bottom 5-month bar chart (already in /overview)."
```

---

## Success criteria

- `/analytics` chỉ còn 4 cards, no bottom chart.
- 0 typecheck error, 0 critical lint error.
- 4 cards click đều điều hướng đúng sub-page.
- Loading/empty states hoạt động cho mỗi card.
- Không trùng data dashboard và sub-pages.
- `analytics-hub-cards.tsx` đã xoá khỏi repo.

## Risks

- **TanStack Query `getAnalytics` race với child components fetch riêng:** mỗi card có query key riêng, không block lẫn nhau. OK.
- **Layout 2x2 quá rộng trên monitor lớn:** chấp nhận, hoặc set `max-w-6xl mx-auto` nếu user feedback. Out of scope.
- **`use no memo` directive:** giữ vì pattern dự án (existing `_content.tsx` cũng có cho overview/products/inventory). Liên quan React Compiler.

## Out-of-scope follow-ups (offer at end)

- Thêm period selector (tháng này / 30 ngày / Q1...) cho cả page nếu user muốn.
- Thêm Export PDF cho cả page (hiện chỉ ở `/overview`).
- Bỏ mock `growth` trong `topProducts` (hardcode random ở `analytics.server.ts:128`) — backend cleanup nhỏ, có thể schedule.
