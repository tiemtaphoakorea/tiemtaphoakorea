# Brainstorm: Báo cáo kho (Inventory Report)

## Problem

`/analytics/inventory` hiện chỉ có: stats tổng quan, low/out stock list, valuation table theo SKU. Thiếu các báo cáo xuất nhập tồn và lịch sử biến động — cần thiết cho quản lý kho chuyên nghiệp.

## Requirements

- **Xuất nhập tồn (XNT)**: Tồn đầu / Nhập / Xuất / Tồn cuối per SKU theo khoảng thời gian
- **Lịch sử biến động**: Log từng event nhập/xuất/điều chỉnh với filter
- **Tồn kho theo danh mục**: BarChart + mini-table nhóm theo category
- **Location**: Thêm vào `/analytics/inventory` (không tạo route mới)
- **No export**: MVP UI only

## Solution

### Layout (bottom sections, thêm vào trang hiện có)

```
[NEW] Tồn kho theo danh mục — BarChart ngang + summary table
[NEW] Xuất nhập tồn (XNT) — date range picker + table
[NEW] Lịch sử biến động kho — filters + log table
```

### Files

| File | Action |
|------|--------|
| `packages/database/src/services/inventory.server.ts` | Thêm `getXntReport()` |
| `apps/admin/app/api/admin/analytics/inventory/xnt/route.ts` | Tạo mới |
| `apps/admin/services/admin.client.ts` | Thêm `getXntReport()` |
| `apps/admin/lib/query-keys.ts` | Thêm `inventory.xnt` key |
| `apps/admin/components/admin/analytics/inventory-category-chart.tsx` | Tạo mới |
| `apps/admin/components/admin/analytics/inventory-xnt-table.tsx` | Tạo mới |
| `apps/admin/components/admin/analytics/inventory-movement-log.tsx` | Tạo mới |
| `apps/admin/app/(dashboard)/analytics/inventory/_content.tsx` | Thêm 3 section |

### XNT Query (PostgreSQL CTE)

```sql
WITH period_movements AS (
  SELECT variant_id,
    SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) AS nhap,
    SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) AS xuat
  FROM inventory_movements
  WHERE created_at BETWEEN $startDate AND $endDate
  GROUP BY variant_id
),
begin_stock AS (
  SELECT DISTINCT ON (variant_id)
    variant_id, on_hand_after AS ton_dau
  FROM inventory_movements
  WHERE created_at < $startDate
  ORDER BY variant_id, created_at DESC
)
SELECT pv.sku, pv.name, p.name product_name, c.name category,
  COALESCE(bs.ton_dau, 0)           AS ton_dau,
  COALESCE(pm.nhap, 0)              AS nhap,
  COALESCE(pm.xuat, 0)              AS xuat,
  COALESCE(bs.ton_dau,0)+COALESCE(pm.nhap,0)-COALESCE(pm.xuat,0) AS ton_cuoi
FROM product_variants pv
LEFT JOIN products p ON p.id = pv.product_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN period_movements pm ON pm.variant_id = pv.id
LEFT JOIN begin_stock bs ON bs.variant_id = pv.id
WHERE pm.nhap > 0 OR pm.xuat > 0 OR bs.ton_dau > 0 OR pv.on_hand > 0
```

### Key Decisions

- **Category chart**: derive từ `valuationData` đã load → 0 API/DB work thêm
- **Movement log**: reuse `/api/admin/inventory/movements` đã có, chỉ thêm UI
- **XNT**: 1 endpoint mới + 1 DB function với CTE query
- **Pagination**: XNT + movement log đều cần pagination

## Risks

- XNT query với DISTINCT ON + 2 CTE có thể chậm nếu nhiều SKU/movements — cần EXPLAIN trên prod data nếu cần
- `inventory_movements` không join đến product name trực tiếp nên cần LEFT JOIN qua productVariants → products
