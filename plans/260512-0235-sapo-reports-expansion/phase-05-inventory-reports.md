# Phase 05 — Inventory Reports (4 reports)

## Context Links
- Plan: [plan.md](./plan.md)
- Schema: `packages/database/src/schema/inventory.ts` (inventoryMovements), `products.ts` (productVariants — has onHand, costPrice WAC, lowStockThreshold)
- Movement type enum: `stock_out | supplier_receipt | manual_adjustment | cancellation | stock_count_balance | cost_adjustment`

## Overview
- **Priority**: P1
- **Status**: pending
- **Brief**: 4 báo cáo Kho — Sapo Tier 1: tồn kho hiện tại / **sổ kho (ledger)** ⭐ / xuất-nhập-tồn (so kỳ) / cảnh báo hết hàng.
- Đã bỏ `stock-value` (gộp KPI giá trị kho vào `current-stock`).

## Key Insights
- `productVariants.onHand` là source of truth tồn kho thực tế (đã tính sau movements).
- `productVariants.costPrice` là WAC current (đã cập nhật bởi supplier receipt flow).
- `inventoryMovements` audit log đầy đủ với `onHandBefore/After`.
- KHÔNG có bảng `daily_inventory_snapshot` → "tồn cuối kỳ X tháng trước" KHÔNG chính xác → stock-value chỉ phản ánh hiện tại (NOTE rõ).
- `lowStockThreshold` mặc định 5 (per variant); báo cáo low-stock dùng giá trị này.

## Requirements
**Functional**
- Filter kỳ chỉ áp dụng cho 5.2 (in-out movement); 3 báo cáo còn lại là snapshot hiện tại.
- Search variant (sku, name).
- Export CSV/XLSX.

## Architecture

### Report 5.1 — `inventory/current-stock` Tồn kho hiện tại (gộp giá trị kho)
- **Route**: `/reports/inventory/current-stock`, `GET /api/admin/reports/inventory/current-stock`
- **SQL**: `SELECT pv.id, pv.sku, p.name product_name, pv.name variant_name, pv.on_hand, pv.reserved, pv.cost_price, pv.on_hand * pv.cost_price AS stock_value, pv.low_stock_threshold, c.name AS category_name FROM product_variants pv INNER JOIN products p ON p.id = pv.product_id LEFT JOIN categories c ON c.id = p.category_id WHERE pv.is_active = true ORDER BY stock_value DESC`
- **Filter**: search, category, stockStatus `all|in-stock|out-of-stock|low`, sort (theo SL hoặc giá trị)
- **KPI**: Số SKU active / Tổng SL tồn / **Tổng giá trị kho (WAC)** / Số SKU low-stock
- **Chart**: pie phân bổ giá trị kho theo category (top 5 + others)
- **Table**: SKU | SP | biến thể | danh mục | tồn | giữ chỗ | có thể bán | WAC | giá trị | ngưỡng cảnh báo | % tổng giá trị
- **Section toggle**: "Theo SKU" (default) vs "Theo danh mục" (group by category, sum value, expandable)
- **Drill-down**: row → sheet 30 movements gần nhất của variant (link tới Sổ kho 5.2)
- **Export**: SKU, Sản phẩm, Biến thể, Danh mục, Tồn, Giữ chỗ, WAC, Giá trị kho, Ngưỡng
- **UI note**: "Giá trị kho tại thời điểm xem — chưa hỗ trợ snapshot lịch sử"

### Report 5.2 — `inventory/ledger` Sổ kho (per-variant) ⭐ NEW
- **Route**: `/reports/inventory/ledger`, `GET /api/admin/reports/inventory/ledger?variantId=...&startDate=...&endDate=...&page=...`
- **Mục đích**: Nhật ký nhập-xuất chi tiết theo từng SP/biến thể (giống Sổ kho Sapo). Bắt buộc chọn 1 variant.
- **SQL**: `SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after, m.reference_type, m.reference_id, m.note, CASE WHEN m.type='supplier_receipt' THEN m.quantity ELSE 0 END AS qty_in, CASE WHEN m.type IN ('stock_out') THEN m.quantity ELSE 0 END AS qty_out, m.unit_cost, m.quantity * m.unit_cost AS value FROM inventory_movements m WHERE m.variant_id = :variantId AND m.created_at BETWEEN :s AND :e ORDER BY m.created_at ASC`
- **Filter**: bắt buộc variant (combobox SKU search), kỳ, type filter (nhập/xuất/điều chỉnh), search ref
- **KPI**: Tồn đầu kỳ / Tổng nhập / Tổng xuất / Tồn cuối kỳ / Giá trị nhập trong kỳ
- **Chart**: line chart on_hand theo timeline trong kỳ
- **Table**: Ngày | loại GD | số chứng từ (link) | diễn giải | nhập | xuất | tồn sau | giá vốn TB | giá trị
- **Empty state**: "Chọn 1 sản phẩm/biến thể để xem sổ kho"
- **Drill-down**: click số chứng từ → mở entity detail (`/receipts/{id}`, `/orders/{id}`, etc.) theo `reference_type`
- **Export**: tất cả cột table, filename = `so-kho-{sku}-{period}.csv`

### Report 5.3 — `inventory/in-out-movement` Xuất-nhập-tồn theo kỳ (so sánh kỳ trước)
- **Route**: `/reports/inventory/in-out-movement`
- **SQL**:
```
WITH agg AS (
  SELECT m.variant_id,
    SUM(CASE WHEN m.type='supplier_receipt' THEN m.quantity ELSE 0 END) qty_in,
    SUM(CASE WHEN m.type IN ('stock_out') THEN -m.quantity ELSE 0 END) qty_out_sales,
    SUM(CASE WHEN m.type IN ('manual_adjustment','stock_count_balance','cost_adjustment','cancellation') THEN m.quantity ELSE 0 END) qty_adjust
  FROM inventory_movements m
  WHERE m.created_at BETWEEN :s AND :e
  GROUP BY m.variant_id
),
opening AS (
  -- onHandBefore of earliest movement in period; fallback: current onHand - net_change in period
  SELECT DISTINCT ON (variant_id) variant_id, on_hand_before AS opening
  FROM inventory_movements
  WHERE created_at BETWEEN :s AND :e
  ORDER BY variant_id, created_at ASC
)
SELECT pv.id, pv.sku, p.name, pv.name AS variant_name,
  COALESCE(o.opening, pv.on_hand) AS opening,
  COALESCE(a.qty_in, 0) qty_in,
  COALESCE(a.qty_out_sales, 0) qty_out,
  COALESCE(a.qty_adjust, 0) qty_adjust,
  pv.on_hand AS closing
FROM product_variants pv
INNER JOIN products p ON p.id = pv.product_id
LEFT JOIN agg a ON a.variant_id = pv.id
LEFT JOIN opening o ON o.variant_id = pv.id
WHERE pv.is_active = true AND (a.variant_id IS NOT NULL OR ...search match)
ORDER BY (qty_in + ABS(qty_out)) DESC
```
- **Filter**: kỳ, search variant, type filter (nhập / xuất / điều chỉnh)
- **KPI**: SL nhập / SL xuất / Điều chỉnh / Giá trị nhập trong kỳ
- **Chart**: stacked bar in/out theo period (day)
- **Table**: SKU | SP | biến thể | tồn đầu | nhập | xuất | điều chỉnh | tồn cuối
- **Drill-down**: row → sheet movements log of variant in period (timestamp, type, qty, ref)
- **Export**: tất cả cột table

### Report 5.4 — `inventory/low-stock` Cảnh báo hết hàng
- **Route**: `/reports/inventory/low-stock`
- **SQL**: `SELECT pv.*, p.name AS product_name FROM product_variants pv INNER JOIN products p ON p.id = pv.product_id WHERE pv.is_active = true AND pv.on_hand <= COALESCE(pv.low_stock_threshold, 5) ORDER BY pv.on_hand ASC`
- **Filter**: search, category, status `low (>0, ≤threshold) | out (=0)`
- **KPI**: SKU sắp hết / SKU hết hàng / Tổng SL còn lại / Số ngày tồn ước tính (n/a — out of scope)
- **Chart**: bar chart top 10 SKU âm nhiều nhất
- **Table**: SKU | SP | tồn | ngưỡng | trạng thái (TonePill) | last received_at | quick action "Tạo PO" (link `/purchases/new?variantId=...`)
- **Export**: SKU, Sản phẩm, Biến thể, Tồn, Ngưỡng, Trạng thái

## Related Code Files

**Create — services**
- `packages/database/src/services/report-inventory-current.server.ts` (gộp value)
- `packages/database/src/services/report-inventory-ledger.server.ts` ⭐ (sổ kho per-variant)
- `packages/database/src/services/report-inventory-movement.server.ts` (xuất-nhập-tồn aggregate)
- `packages/database/src/services/report-inventory-low-stock.server.ts`
- `packages/database/src/services/report-inventory.server.ts` (barrel)
- (optional helper) `report-inventory-shared.server.ts` — `movementTypeBuckets`, `qtyInExpr`, `qtyOutExpr` constants dùng chung 5.2 + 5.3.

**Create — API routes** (8: 4 main + 4 export)
- `apps/admin/app/api/admin/reports/inventory/{current-stock,ledger,in-out-movement,low-stock}/route.ts`
- `apps/admin/app/api/admin/reports/inventory/{...}/export/route.ts`

**Create — UI pages**
- `apps/admin/app/(dashboard)/reports/inventory/{current-stock,ledger,in-out-movement,low-stock}/_content.tsx`
- `apps/admin/components/admin/reports/report-movements-log-sheet.tsx` (drilldown từ in-out-movement)
- `apps/admin/components/admin/reports/variant-picker-combobox.tsx` (cho ledger filter — dùng existing combobox primitive)

**Modify**
- `apps/admin/services/reports.client.ts` (hoặc tạo `reports-inventory.client.ts`)
- `apps/admin/lib/report-formatters.ts` — movement type labels

## Implementation Steps
1. Service files với raw SQL where complex aggregation needed (5.2). Còn lại dùng Drizzle query builder.
2. API routes follow pattern.
3. UI pages copy shell; chart-heavy (5.2) cần `ChartContainer` + ResponsiveContainer.
4. Movements log sheet shared.

## Todo List
- [ ] 4 service files + barrel + (optional) shared helper
- [ ] 8 API routes
- [ ] 4 `_content.tsx`
- [ ] movements log drilldown sheet
- [ ] variant picker combobox cho ledger filter
- [ ] Type-check + smoke
- [ ] Export verify (gồm filename per-variant cho ledger)

## Success Criteria
- KPI "Tổng giá trị kho" (5.1) = SUM(onHand × costPrice) sample query.
- 5.2 ledger: SUM(qty_in) - SUM(qty_out) + opening = closing per variant.
- 5.3 in-out-movement: opening + in - out + adjust = closing với mọi variant có movement.
- 5.3 + 5.2 cùng kỳ + cùng variant: KPI tổng nhập/xuất khớp.
- 5.4 hiển thị đúng SKU với onHand=0 và onHand≤threshold.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Opening balance sai khi variant chưa có movement trong kỳ | H | M | Fallback `pv.onHand - net_change_in_period` (compute server side) |
| `cost_adjustment` movement type — quantity=0? | M | M | Verify behavior; treat in `qty_adjust` bucket |
| Categories join chậm với 10k SKU | M | L | Pre-aggregate; LIMIT top sau group |
| WAC outdated (rebuild requires recompute) | L | M | Trust `productVariants.costPrice` — đó là source of truth hiện hành |
| User expects daily snapshot for value-over-time | M | M | Note explicitly: "chưa hỗ trợ" trong UI + unresolved |

## Security
- Auth owner.

## Rollback
- Xóa thư mục `inventory/` ở app + api.

## Next Steps
- Phase 06 customers.
