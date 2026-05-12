# Phase 04 — Purchases Reports (5 reports)

## Context Links
- Plan: [plan.md](./plan.md)
- Schema: `packages/database/src/schema/receipts.ts` (goodsReceipts, goodsReceiptItems, supplierPayments), `purchases.ts` (purchaseOrders)
- Reference: pattern phase-03 sales

## Overview
- **Priority**: P1
- **Status**: pending
- **Brief**: 5 báo cáo nhóm Nhập hàng — Sapo Tier 1: theo thời gian / theo NCC / theo sản phẩm / **theo nhân viên** ⭐ / chi trả NCC theo phương thức.

## Key Insights
- Data source chính: `goods_receipts` (`status='completed'`, `cancelled_at IS NULL`) + `goods_receipt_items` (qty + actual unit cost).
- Tiền chi NCC: `supplier_payments.method` + `amount` + `paid_at`.
- "Giá trị nhập" = `goods_receipts.payable_amount` (sau discount + extra_cost). Khớp với supplier debts existing.
- `purchaseOrders` (OSN) ưu tiên ẩn — báo cáo Sapo "Nhập hàng" tập trung `goods_receipts` (PON) là sự kiện thực nhập.

## Requirements
**Functional** (chung)
- Filter: kỳ, NCC, search, status `goods_receipts.status`.
- KPI cards: 4 metrics.
- Chart trend.
- Table phân trang + drill-down sang `/receipts/{id}`.
- Export CSV/XLSX.

## Architecture

### Report 4.1 — `purchases/by-time` Giá trị nhập theo thời gian
- **Route**: `/reports/purchases/by-time`, `GET /api/admin/reports/purchases/by-time`
- **SQL**: `SELECT to_char(date_trunc(:gb, created_at), :fmt) period, COUNT(*) receipt_count, SUM(total_qty) qty, SUM(payable_amount) payable, SUM(paid_amount) paid, SUM(debt_amount) debt FROM goods_receipts WHERE status='completed' AND cancelled_at IS NULL AND created_at BETWEEN :s AND :e GROUP BY 1`
- **KPI**: Tổng phiếu / Tổng SL / Tổng giá trị / Đã trả / Còn nợ
- **Chart**: stacked bar payable vs paid theo period
- **Table**: period | phiếu | SL | giá trị | đã trả | nợ
- **Export**: Kỳ, Số phiếu, SL, Giá trị, Đã trả, Nợ

### Report 4.2 — `purchases/by-supplier` Nhập hàng theo NCC
- **Route**: `/reports/purchases/by-supplier`
- **SQL**: `SELECT s.id, s.name, s.code, COUNT(r.*) receipt_count, SUM(r.total_qty) qty, SUM(r.payable_amount) payable, SUM(r.paid_amount) paid FROM goods_receipts r LEFT JOIN suppliers s ON s.id = r.supplier_id WHERE r.status='completed' AND r.cancelled_at IS NULL AND r.created_at BETWEEN ... GROUP BY s.id, s.name, s.code ORDER BY payable DESC`
- **Filter**: kỳ, search NCC
- **KPI**: Số NCC nhập / Số phiếu / Tổng giá trị / NCC top
- **Chart**: horizontal bar top 10 NCC theo giá trị
- **Table**: NCC | code | số phiếu | SL | giá trị | đã trả | còn nợ | TB/phiếu
- **Drill-down**: row → sheet danh sách receipts của NCC đó, click → `/receipts/{id}`
- **Export**: NCC, Code, Số phiếu, SL, Giá trị, Đã trả, Còn nợ

### Report 4.3 — `purchases/by-product` Nhập hàng theo sản phẩm
- **Route**: `/reports/purchases/by-product`
- **SQL**: `SELECT gri.variant_id, pv.sku, p.name, pv.name AS variant_name, SUM(gri.quantity) qty, SUM(gri.line_total) total, AVG(gri.unit_cost) avg_cost FROM goods_receipt_items gri INNER JOIN goods_receipts r ON r.id = gri.receipt_id INNER JOIN product_variants pv ON pv.id = gri.variant_id INNER JOIN products p ON p.id = pv.product_id WHERE r.status='completed' AND r.cancelled_at IS NULL AND r.created_at BETWEEN ... GROUP BY 1,2,3,4 ORDER BY total DESC`
- **Filter**: kỳ, search SP/SKU
- **KPI**: Số SKU nhập / SL nhập / Tổng giá trị / TB giá nhập
- **Chart**: horizontal bar top 10 SP theo giá trị nhập
- **Table**: SKU | SP | biến thể | SL nhập | giá trị | giá TB nhập | WAC hiện tại (= `productVariants.costPrice`)
- **Drill-down**: row → sheet `receipts` chứa variant, click → `/receipts/{id}`
- **Export**: SKU, Sản phẩm, Biến thể, SL, Giá trị, Giá TB

### Report 4.4 — `purchases/by-staff` Nhập hàng theo nhân viên ⭐ NEW
- **Route**: `/reports/purchases/by-staff`, `GET /api/admin/reports/purchases/by-staff`
- **SQL**: `SELECT pr.id, pr.full_name, COUNT(r.*) receipt_count, SUM(r.total_qty) qty, SUM(r.payable_amount) payable, SUM(r.paid_amount) paid FROM goods_receipts r LEFT JOIN profiles pr ON pr.id = r.created_by WHERE r.status='completed' AND r.cancelled_at IS NULL AND r.created_at BETWEEN :s AND :e GROUP BY pr.id, pr.full_name ORDER BY payable DESC`
- **Filter**: kỳ, search NV
- **KPI**: Tổng NV nhập / Tổng phiếu / Tổng giá trị / NV top
- **Chart**: bar top 10 NV theo giá trị nhập
- **Table**: NV | số phiếu | SL nhập | giá trị | đã trả | còn nợ | TB/phiếu
- **Drill-down**: click NV → sheet receipts NV đó tạo, click → `/receipts/{id}`
- **Export**: NV, Số phiếu, SL, Giá trị, Đã trả, Còn nợ
- **Note**: phụ thuộc `goods_receipts.created_by`. Nếu null (cũ) → bucket "Chưa rõ NV".

### Report 4.5 — `purchases/payouts-by-method` Chi trả NCC theo phương thức (renumbered: was 4.4)
- **Route**: `/reports/purchases/payouts-by-method`
- **SQL**: `SELECT method, COUNT(*) tx_count, SUM(amount) total FROM supplier_payments WHERE paid_at BETWEEN :s AND :e GROUP BY method`
- **Filter**: kỳ
- **KPI**: Tổng chi / Số giao dịch / TB / Phương thức nhiều nhất
- **Chart**: pie chart by method
- **Table**: Phương thức | số GD | tổng | % | TB
- **Drill-down**: list `supplier_payments` raw rows
- **Export**: Phương thức, Số GD, Tổng, %

## Related Code Files

**Create — services**
- `packages/database/src/services/report-purchases-by-time.server.ts`
- `packages/database/src/services/report-purchases-by-supplier.server.ts`
- `packages/database/src/services/report-purchases-by-product.server.ts`
- `packages/database/src/services/report-purchases-by-staff.server.ts` ⭐
- `packages/database/src/services/report-purchases-payouts.server.ts`
- `packages/database/src/services/report-purchases.server.ts` (barrel)

**Create — API routes** (10 files: 5 main + 5 export)
- `apps/admin/app/api/admin/reports/purchases/{by-time,by-supplier,by-product,by-staff,payouts-by-method}/route.ts`
- `apps/admin/app/api/admin/reports/purchases/{...}/export/route.ts`

**Create — UI**
- `apps/admin/app/(dashboard)/reports/purchases/{by-time,by-supplier,by-product,by-staff,payouts-by-method}/_content.tsx`
- `apps/admin/components/admin/reports/report-drilldown-receipts-sheet.tsx` (reusable)

**Modify**
- `apps/admin/services/reports.client.ts` (hoặc tạo `reports-purchases.client.ts` nếu vượt 200 LOC)
- `apps/admin/lib/report-formatters.ts` — thêm labels nhập hàng.

## Implementation Steps
1. Tạo 4 service files theo pattern phase 03.
2. Tạo API routes (mirror existing financial routes).
3. Tạo 4 `_content.tsx` (copy shell từ `profit-loss/_content.tsx`).
4. Tạo `report-drilldown-receipts-sheet.tsx` shared.
5. Compile + smoke.

## Todo List
- [ ] 5 service files + barrel
- [ ] 10 API routes
- [ ] 5 `_content.tsx`
- [ ] receipts drilldown sheet
- [ ] Type-check + smoke test
- [ ] Export verify

## Success Criteria
- Tổng `payable_amount` (by-time tổng kỳ) = tổng (by-supplier).
- Tổng `payable_amount - paid_amount` = tổng `debt` trong supplier-debts existing report (khoảng kiểm sanity).
- Click receipt → `/receipts/{id}` mở đúng.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `goods_receipts.cancelled_at` filter sót | M | M | Centralize where-clause helper `activeReceiptsWhere` |
| Group by variant nhưng product hoặc variant đổi tên | L | L | Snapshot name không có ở `goods_receipt_items` → join live, OK |
| `supplier_payments` cũ không có method (cũ null) | L | L | COALESCE method → 'unknown' bucket |
| `purchase_orders` user expectation - có cần báo cáo PO? | M | M | Note unresolved — phase 04 chỉ làm 4 receipts-centric reports |

## Security
- Auth `requireApiUser(request, "owner")`.

## Rollback
- Xóa thư mục `purchases/` ở app + api.

## Next Steps
- Phase 05 inventory.
