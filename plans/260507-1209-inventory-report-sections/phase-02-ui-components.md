---
phase: 2
title: "UI Components"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: UI Components

## Overview

Tạo 3 component mới trong `components/admin/analytics/`: category chart, XNT table, movement log.

## Requirements

- Tất cả dùng shadcn primitives (`Table`, `Card`, `Input`, `Select`, v.v.)
- Reuse `FinanceRangePicker` cho date range selection
- Reuse `TableLoadingRows`, `TableEmptyRow` từ `data-state`
- Số tiền format bằng `formatVnd` (đã có)
- Mỗi file < 200 LOC

## Architecture

### Component 1: `inventory-category-chart.tsx`

Props: `items: InventoryValuationItem[]` (từ valuationData đã load ở parent — **không cần API mới**)

Logic:
- Group items by `categoryName`, aggregate `onHand` + `stockValue`
- Render `BarChart` ngang (recharts) — giống `CategorySalesChart` pattern đã có
- Mini-table bên dưới: Danh mục | SKU count | Số lượng | Giá trị

```tsx
const byCategory = items.reduce((acc, item) => {
  const key = item.categoryName || "Chưa phân loại";
  if (!acc[key]) acc[key] = { name: key, skuCount: 0, qty: 0, value: 0 };
  acc[key].skuCount++;
  acc[key].qty += item.onHand ?? 0;
  acc[key].value += Number(item.stockValue);
  return acc;
}, {} as Record<string, CategorySummary>);
```

### Component 2: `inventory-xnt-table.tsx`

Props:
```ts
{
  items: XntRow[];
  totals: { totalNhap: number; totalXuat: number; skuCount: number } | null;
  metadata: { total: number; page: number; totalPages: number } | null;
  isLoading: boolean;
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (r: DateRange) => void;
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: { id: string; name: string }[];
  page: number;
  onPageChange: (p: number) => void;
}
```

Layout:
- Header: title "Xuất nhập tồn" + `FinanceRangePicker`
- Filter row: Search input + category select
- Table: SKU | Sản phẩm | Tồn đầu | Nhập | Xuất | Tồn cuối
  - Cột Nhập: text-emerald-600 nếu > 0
  - Cột Xuất: text-red-500 nếu > 0
  - Cột Tồn cuối: bold, red nếu = 0, amber nếu < threshold
- Footer: tổng hàng + `PaginationControls`

### Component 3: `inventory-movement-log.tsx`

Props:
```ts
{
  data: InventoryMovement[];
  metadata: { total: number; page: number; totalPages: number } | null;
  isLoading: boolean;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  movementType: string;
  onMovementTypeChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  onPageChange: (p: number) => void;
}
```

Movement type labels (Vietnamese):
```ts
const TYPE_LABELS: Record<string, string> = {
  stock_out: "Xuất bán",
  supplier_receipt: "Nhập hàng",
  manual_adjustment: "Điều chỉnh",
  cancellation: "Hủy đơn",
  stock_count_balance: "Kiểm kho",
  cost_adjustment: "Điều chỉnh giá vốn",
};
```

Table: Thời gian | SKU | Loại | Nhập | Xuất | Trước | Sau | Ghi chú | NV
- Nhập/Xuất column: hiển thị quantity (positive = nhập/emerald, negative = xuất/red)
- Loại: dùng `TonePill` với màu phù hợp

## Related Code Files

- Create: `apps/admin/components/admin/analytics/inventory-category-chart.tsx`
- Create: `apps/admin/components/admin/analytics/inventory-xnt-table.tsx`
- Create: `apps/admin/components/admin/analytics/inventory-movement-log.tsx`
- Read: `apps/admin/components/admin/analytics/category-sales-chart.tsx` (pattern reference)
- Read: `apps/admin/components/admin/analytics/inventory-valuation-table.tsx` (pattern reference)
- Read: `apps/admin/components/admin/analytics/finance-range-picker.tsx` (reuse)
- Read: `apps/admin/components/admin/shared/data-state.tsx` (TableLoadingRows, TableEmptyRow)
- Read: `apps/admin/components/admin/shared/status-badge.tsx` (TonePill)

## Implementation Steps

1. **`inventory-category-chart.tsx`**:
   - Import `Bar`, `BarChart`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis` từ recharts
   - Compute `byCategory` aggregate từ props
   - Render horizontal BarChart (layout="vertical") theo `value` (stockValue)
   - Render mini-table bên dưới chart

2. **`inventory-xnt-table.tsx`**:
   - Import `FinanceRangePicker` từ `./finance-range-picker`
   - Import `PaginationControls` từ `@workspace/ui/components/pagination-controls`
   - Table columns: SKU | Sản phẩm | Tồn đầu | Nhập | Xuất | Tồn cuối
   - TableFooter totals row

3. **`inventory-movement-log.tsx`**:
   - Filter bar: date range + type select + search
   - Table với 9 columns
   - Format `createdAt` với `date-fns/format` → "dd/MM HH:mm"
   - `TonePill` cho movement type

## Success Criteria

- [ ] Category chart render đúng với mock data (không cần API)
- [ ] XNT table hiển thị loading/empty states đúng
- [ ] Movement log filter hoạt động (type + date range)
- [ ] Pagination hoạt động ở cả 2 tables
- [ ] Không có TypeScript errors

## Risk Assessment

- `PaginationControls` cần check props interface trước khi dùng — xem `packages/ui/src/components/pagination-controls.tsx`
- Recharts có thể cần `"use client"` directive — đã thấy ở các chart khác
