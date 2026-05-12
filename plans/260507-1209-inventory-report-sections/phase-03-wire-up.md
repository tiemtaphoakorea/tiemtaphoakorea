---
phase: 3
title: "Wire-up & Integration"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2]
---

# Phase 3: Wire-up & Integration

## Overview

Thêm 3 section mới vào `_content.tsx` của `/analytics/inventory`, wire up state + queries cho từng component.

## Requirements

- Giữ nguyên 4 section hiện có, thêm 3 section ở dưới
- Mỗi section có state riêng (date range, search, page, v.v.)
- Category chart reuse `valuationData` đã có (không query thêm)
- XNT và movement log có query riêng với `useQuery`

## Architecture

**State trong `_content.tsx`:**

```ts
// XNT state
const [xntDateRange, setXntDateRange] = useState<DateRange>(thisMonthRange());
const [xntSearch, setXntSearch] = useState("");
const [xntCategoryId, setXntCategoryId] = useState("");
const [xntPage, setXntPage] = useState(1);
const [debouncedXntSearch] = useDebounce(xntSearch, 300);

// Movement log state
const [movDateRange, setMovDateRange] = useState<DateRange>(last7DaysRange());
const [movType, setMovType] = useState("");
const [movSearch, setMovSearch] = useState("");
const [movPage, setMovPage] = useState(1);
const [debouncedMovSearch] = useDebounce(movSearch, 300);
```

**Queries:**

```ts
// XNT
const xntParams = { ...xntDateRange, search: debouncedXntSearch || undefined, categoryId: xntCategoryId || undefined, page: xntPage };
const { data: xntData, isLoading: isLoadingXnt } = useQuery({
  queryKey: queryKeys.admin.inventory.xnt(xntParams),
  queryFn: () => adminClient.getXntReport(xntParams),
});

// Movement log — reuse existing adminClient.getInventoryMovements
const movParams = { ...movDateRange, type: movType || undefined, variantId: undefined, page: movPage, limit: 20 };
const { data: movData, isLoading: isLoadingMov } = useQuery({
  queryKey: queryKeys.admin.inventory.movements(movParams),
  queryFn: () => adminClient.getInventoryMovements(movParams),
});
```

**Thứ tự render (top → bottom):**
1. `<AnalyticsSubpageHeader>` (existing)
2. `<InventoryStats>` (existing)
3. Low/Out stock 2-column grid (existing)
4. `<InventoryValuationTable>` (existing)
5. `<InventoryCategoryChart>` ← NEW (pass `valuationData?.items`)
6. `<InventoryXntTable>` ← NEW
7. `<InventoryMovementLog>` ← NEW

## Related Code Files

- Modify: `apps/admin/app/(dashboard)/analytics/inventory/_content.tsx`
- Read: `apps/admin/components/admin/analytics/inventory-category-chart.tsx`
- Read: `apps/admin/components/admin/analytics/inventory-xnt-table.tsx`
- Read: `apps/admin/components/admin/analytics/inventory-movement-log.tsx`

## Implementation Steps

1. **Đọc lại `_content.tsx`** để nắm imports hiện có

2. **Thêm helper functions** trên cùng file (nếu chưa có):
   ```ts
   function thisMonthRange(): DateRange { ... }
   function last7DaysRange(): DateRange { ... }
   ```

3. **Thêm state** cho XNT và movement log (xem Architecture)

4. **Thêm 2 queries** (`xntData`, `movData`) sau các queries hiện có

5. **Thêm imports** 3 component mới

6. **Thêm 3 JSX section** sau `</div>` của InventoryValuationTable:
   ```tsx
   {/* Tồn kho theo danh mục */}
   <div className="flex flex-col gap-4">
     <h2 className="text-lg font-black tracking-tight text-slate-900">Tồn kho theo danh mục</h2>
     <InventoryCategoryChart items={(valuationData?.items ?? []) as InventoryValuationItem[]} isLoading={isLoadingValuation} />
   </div>

   {/* Xuất nhập tồn */}
   <div className="flex flex-col gap-4">
     <InventoryXntTable ... />
   </div>

   {/* Lịch sử biến động */}
   <div className="flex flex-col gap-4">
     <InventoryMovementLog ... />
   </div>
   ```

7. **Reset page khi filter thay đổi** (useEffect hoặc inline trong handler):
   - XNT: reset `xntPage` khi search/categoryId/dateRange thay đổi
   - Movement: reset `movPage` khi type/search/dateRange thay đổi

8. **TypeScript check**: `pnpm --filter @workspace/admin tsc --noEmit`

## Success Criteria

- [ ] Trang `/analytics/inventory` render đủ 7 section, không lỗi
- [ ] XNT section load data với default date range (tháng này)
- [ ] Movement log section load data với default range (7 ngày)
- [ ] Category chart hiển thị khi valuation data đã load
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No console errors

## Risk Assessment

- `_content.tsx` hiện ~120 LOC; sau khi thêm state + queries sẽ ~200 LOC — xem xét tách helper functions nếu vượt ngưỡng
- Cần reset page đúng chỗ để tránh UI bị stuck ở page 2+ khi filter thay đổi
