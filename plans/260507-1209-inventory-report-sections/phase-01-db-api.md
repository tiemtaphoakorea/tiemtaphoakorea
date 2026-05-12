---
phase: 1
title: "DB & API (XNT endpoint)"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: DB & API (XNT endpoint)

## Overview

Thêm `getXntReport()` vào `inventory.server.ts`, tạo API route mới, đăng ký endpoint trong `api-endpoints.ts`, thêm client method và query key.

## Requirements

- `getXntReport({ startDate, endDate, search?, categoryId?, page?, limit? })` trả về: `{ items: XntRow[], totals, metadata }`
- XntRow: `{ variantId, sku, variantName, productName, categoryName, tonDau, nhap, xuat, tonCuoi }`
- API route: `GET /api/admin/analytics/inventory/xnt`
- Chỉ trả về SKU có activity trong kỳ HOẶC tồn hiện tại > 0

## Architecture

**XNT Query (Drizzle + raw SQL CTE):**

```sql
WITH period_movements AS (
  SELECT variant_id,
    SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END)       AS nhap,
    SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END)  AS xuat
  FROM inventory_movements
  WHERE created_at >= $startDate AND created_at <= $endDate
  GROUP BY variant_id
),
begin_stock AS (
  SELECT DISTINCT ON (variant_id)
    variant_id, on_hand_after AS ton_dau
  FROM inventory_movements
  WHERE created_at < $startDate
  ORDER BY variant_id, created_at DESC
)
SELECT pv.id, pv.sku, pv.name AS variant_name,
       p.name AS product_name, c.name AS category_name, c.id AS category_id,
       COALESCE(bs.ton_dau, 0)                                 AS ton_dau,
       COALESCE(pm.nhap, 0)                                    AS nhap,
       COALESCE(pm.xuat, 0)                                    AS xuat,
       COALESCE(bs.ton_dau,0)+COALESCE(pm.nhap,0)-COALESCE(pm.xuat,0) AS ton_cuoi
FROM product_variants pv
LEFT JOIN products p  ON p.id = pv.product_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN period_movements pm ON pm.variant_id = pv.id
LEFT JOIN begin_stock  bs ON bs.variant_id = pv.id
WHERE (pm.nhap > 0 OR pm.xuat > 0 OR COALESCE(bs.ton_dau, 0) > 0 OR pv.on_hand > 0)
  -- + search / categoryId WHERE clauses injected via sql template
ORDER BY (COALESCE(pm.nhap,0) + COALESCE(pm.xuat,0)) DESC, pv.sku
```

Dùng `sql\`...\`` của Drizzle để compose CTE với dynamic WHERE.

## Related Code Files

- Modify: `packages/database/src/services/inventory.server.ts`
- Create: `apps/admin/app/api/admin/analytics/inventory/xnt/route.ts`
- Modify: `packages/shared/src/api-endpoints.ts`
- Modify: `apps/admin/services/admin.client.ts`
- Modify: `apps/admin/lib/query-keys.ts`

## Implementation Steps

1. **`inventory.server.ts`** — Thêm `getXntReport()`:
   - Build raw SQL string với 2 CTE + dynamic WHERE (search/categoryId)
   - Trả về `{ items, totals: { totalNhap, totalXuat, skuCount }, metadata: { total, page, totalPages } }`
   - Pagination: dùng `LIMIT $limit OFFSET $offset` trong outer query

2. **`api-endpoints.ts`** — Thêm:
   ```ts
   INVENTORY_XNT: "/api/admin/analytics/inventory/xnt",
   ```

3. **API route** `apps/admin/app/api/admin/analytics/inventory/xnt/route.ts`:
   - Validate `startDate`, `endDate` (required), parse `page`, `limit`, `search`, `categoryId`
   - Call `getXntReport(...)`, return JSON
   - Auth guard với `getInternalUser`

4. **`admin.client.ts`** — Thêm:
   ```ts
   async getXntReport(params: { startDate: string; endDate: string; search?: string; categoryId?: string; page?: number; limit?: number }) {
     return axios.get(API_ENDPOINTS.ADMIN.INVENTORY_XNT, { params }) as ...
   }
   ```
   Export type `XntRow`.

5. **`query-keys.ts`** — Thêm trong `admin.inventory`:
   ```ts
   xnt: (params: Record<string, unknown>) => ["admin", "inventory", "xnt", params] as const,
   ```

## Success Criteria

- [ ] `getXntReport()` trả về data đúng cho 1 kỳ có movement data
- [ ] API route trả 401 nếu không authed, 400 nếu thiếu startDate/endDate
- [ ] Pagination hoạt động đúng
- [ ] Type `XntRow` được export từ `admin.client.ts`

## Risk Assessment

- DISTINCT ON là PostgreSQL-specific — OK vì project dùng Postgres (Supabase)
- CTE với nhiều SKU + dài kỳ có thể chậm; index `idx_inv_movements_created_at` + `idx_inv_movements_variant` đã có sẵn
