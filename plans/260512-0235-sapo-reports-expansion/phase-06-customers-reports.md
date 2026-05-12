# Phase 06 — Customers Reports (4 reports)

## Context Links
- Plan: [plan.md](./plan.md)
- Schema: `packages/database/src/schema/profiles.ts` (profiles, role=customer), `orders.ts`

## Overview
- **Priority**: P2
- **Status**: pending
- **Brief**: 4 báo cáo Khách hàng — Sapo Tier 1: top theo doanh thu / top theo số đơn / khách mới vs quay lại / **theo sản phẩm** ⭐.

## Key Insights
- `profiles.role='customer'` lọc khách hàng.
- "Khách mới" trong kỳ K = khách CHƯA có order trước `K.start` VÀ có order trong K.
- "Khách quay lại" trong kỳ K = khách có order trước K.start VÀ có order trong K.
- Dùng `orders.cancelledAt IS NULL` cho tất cả query.

## Requirements
**Functional**
- Filter: kỳ, search KH, sort.
- KPI 4 cards.
- Chart trend hoặc pie.
- Table phân trang + click row → `/customers/{id}` chi tiết.
- Export CSV/XLSX.

## Architecture

### Report 6.1 — `customers/top-by-revenue` Top KH theo doanh thu
- **Route**: `/reports/customers/top-by-revenue`, `GET /api/admin/reports/customers/top-by-revenue`
- **SQL**: `SELECT p.id, p.full_name, p.phone, p.customer_code, COUNT(o.*) order_count, SUM(o.total) revenue, AVG(o.total) aov, MAX(o.created_at) last_order_at FROM profiles p INNER JOIN orders o ON o.customer_id = p.id WHERE p.role='customer' AND o.cancelled_at IS NULL AND o.created_at BETWEEN :s AND :e GROUP BY p.id, p.full_name, p.phone, p.customer_code ORDER BY revenue DESC`
- **Filter**: kỳ, search, limit 50 mặc định
- **KPI**: Tổng KH có mua / Tổng doanh thu / Doanh thu TB/KH / Top 1
- **Chart**: horizontal bar top 10 KH
- **Table**: KH | code | SĐT | số đơn | doanh thu | AOV | đơn gần nhất
- **Drill-down**: click row → `/customers/{id}` mở tab mới
- **Export**: KH, Code, SĐT, Số đơn, Doanh thu, AOV, Lần mua gần nhất

### Report 6.2 — `customers/top-by-orders` Top KH theo số đơn
- **Route**: `/reports/customers/top-by-orders`
- **SQL**: Same shape as 6.1 nhưng `ORDER BY order_count DESC`
- **Filter, KPI, Chart, Table**: same fields, sort khác
- **Export**: same columns
- (Lý do tách: Sapo có 2 báo cáo riêng vì UX tab khác nhau; tiết kiệm query bằng cách share service `getCustomersAggregate(orderBy)`)

### Report 6.3 — `customers/by-product` Khách hàng theo sản phẩm ⭐ NEW
- **Route**: `/reports/customers/by-product`, `GET /api/admin/reports/customers/by-product`
- **Mục đích**: Trả lời "SP nào kéo nhiều khách nhất?" / "Khách hàng nào mua SP X?"
- **SQL** (group by variant): `SELECT oi.variant_id, pv.sku, p.name AS product_name, pv.name AS variant_name, COUNT(DISTINCT o.customer_id) customer_count, COUNT(DISTINCT o.id) order_count, SUM(oi.quantity) qty, SUM(oi.line_total) revenue FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id INNER JOIN product_variants pv ON pv.id = oi.variant_id INNER JOIN products p ON p.id = pv.product_id WHERE o.cancelled_at IS NULL AND o.created_at BETWEEN :s AND :e GROUP BY oi.variant_id, pv.sku, p.name, pv.name ORDER BY customer_count DESC`
- **Filter**: kỳ, search SP/SKU, sort (theo customer_count default, hoặc revenue/qty)
- **KPI**: Tổng SKU bán / Tổng KH unique / SP có nhiều KH nhất / TB KH/SP
- **Chart**: horizontal bar top 10 SP theo số khách
- **Table**: SKU | SP | biến thể | số KH | số đơn | SL bán | doanh thu
- **Drill-down**: click row → sheet danh sách KH đã mua SP đó trong kỳ (KH | số lần mua | tổng SL | tổng chi); click KH → `/customers/{id}`
- **Export**: SKU, Sản phẩm, Biến thể, Số KH, Số đơn, SL, Doanh thu
- **Note**: distinct count = `COUNT(DISTINCT customer_id)`. Performance: cần index trên `orders(customer_id, created_at)` (đã có).

### Report 6.4 — `customers/new-vs-returning` Khách mới vs quay lại (renumbered: was 6.3)
- **Route**: `/reports/customers/new-vs-returning`
- **SQL**:
```
WITH first_order AS (
  SELECT customer_id, MIN(created_at) AS first_at
  FROM orders
  WHERE cancelled_at IS NULL
  GROUP BY customer_id
),
in_period AS (
  SELECT DISTINCT customer_id FROM orders
  WHERE cancelled_at IS NULL AND created_at BETWEEN :s AND :e
),
classified AS (
  SELECT ip.customer_id,
    CASE WHEN fo.first_at >= :s AND fo.first_at <= :e THEN 'new'
         ELSE 'returning' END AS bucket
  FROM in_period ip
  INNER JOIN first_order fo ON fo.customer_id = ip.customer_id
)
SELECT c.bucket,
  COUNT(*) customers,
  SUM(o.total) revenue,
  SUM(o.profit) profit,
  COUNT(o.*) orders
FROM classified c
INNER JOIN orders o ON o.customer_id = c.customer_id AND o.cancelled_at IS NULL
  AND o.created_at BETWEEN :s AND :e
GROUP BY c.bucket
```
- **Filter**: kỳ, compare period
- **KPI**: KH mới / KH quay lại / Tỷ lệ mới / Doanh thu từ KH quay lại
- **Chart**: pie chart new vs returning (count + revenue 2 mode toggle)
- **Table** (summary): bucket | số KH | số đơn | doanh thu | AOV | % tổng
- **Sub-section**: time-series new vs returning theo period (chart line)
- **Drill-down**: click bucket → list KH thuộc bucket (paginated)
- **Export**: Bucket, Số KH, Số đơn, Doanh thu, AOV

## Related Code Files

**Create — services**
- `packages/database/src/services/report-customers-top.server.ts` (shared 6.1 + 6.2 via param)
- `packages/database/src/services/report-customers-by-product.server.ts` ⭐
- `packages/database/src/services/report-customers-segmentation.server.ts` (6.4)
- `packages/database/src/services/report-customers.server.ts` (barrel)

**Create — API routes** (8: 4 main + 4 export)
- `apps/admin/app/api/admin/reports/customers/{top-by-revenue,top-by-orders,by-product,new-vs-returning}/route.ts`
- `apps/admin/app/api/admin/reports/customers/{...}/export/route.ts`

**Create — UI pages**
- `apps/admin/app/(dashboard)/reports/customers/{top-by-revenue,top-by-orders,by-product,new-vs-returning}/_content.tsx`
- `apps/admin/components/admin/reports/report-drilldown-customers-sheet.tsx` (KH-list drilldown — share giữa 6.3 + 6.4)

**Modify**
- `apps/admin/services/reports.client.ts` (hoặc tạo `reports-customers.client.ts`)

## Implementation Steps
1. Service `getCustomerAggregate({ startDate, endDate, sortBy: 'revenue'|'order_count', search, page, limit })` shared 6.1+6.2.
2. Service `getCustomersByProduct({ startDate, endDate, search, sortBy, page, limit })` cho 6.3.
3. Service `getNewVsReturningReport({ startDate, endDate, compare? })` cho 6.4.
4. API routes + UI pages.
5. Customer drilldown sheet (list customers in bucket / KH mua SP).

## Todo List
- [ ] 3 service files + barrel
- [ ] 8 API routes
- [ ] 4 `_content.tsx`
- [ ] customers drilldown sheet
- [ ] Type-check + smoke
- [ ] Export verify

## Success Criteria
- 6.1 + 6.2: count khách = COUNT DISTINCT customer_id of orders trong kỳ.
- 6.3: SUM(qty) = tổng SL bán; SUM(revenue) khớp với sales by-product cùng kỳ.
- 6.4: `new + returning = total distinct customers in period`.
- Click KH → `/customers/{id}` mở đúng.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Khách chưa đăng ký (guest checkout) | M | M | Customer `id` luôn ref profile (per schema NOT NULL); guest đã được upsert vào profiles → OK |
| KH có phone trùng tạo profile mới | L | M | Out of scope; báo cáo trung thực với data hiện có |
| Customer count khác nhau giữa các báo cáo | M | M | Define helper `activeCustomersWhere` for consistency |
| `first_order` query toàn bảng → chậm | M | M | Index `idx_orders_customer` đã có; nếu chậm ở phase 07 → materialized view future |

## Security
- Auth owner.
- PII: SĐT, full_name. Đã giới hạn role owner → OK.

## Rollback
- Xóa thư mục `customers/` ở app + api.

## Next Steps
- Phase 07 testing & polish.
