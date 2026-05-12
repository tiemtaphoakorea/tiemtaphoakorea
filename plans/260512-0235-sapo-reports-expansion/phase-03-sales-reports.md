# Phase 03 — Sales Reports (8 reports)

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 02: [phase-02-split-report-service.md](./phase-02-split-report-service.md)
- Schema: `packages/database/src/schema/orders.ts` (orders, orderItems, payments)
- Reference pattern: `apps/admin/app/(dashboard)/reports/profit-loss/_content.tsx`

## Overview
- **Priority**: P1
- **Status**: pending
- **Brief**: 8 báo cáo nhóm Bán hàng — Sapo Tier 1.
  - **Doanh thu**: by-time, by-staff, by-product, by-customer, by-order
  - **Thanh toán**: payments-by-method, payments-by-staff, payments-by-time

## Key Insights
- Tất cả 5 báo cáo derive từ `orders` + `order_items` + `payments` + `profiles`.
- "Doanh thu" định nghĩa thống nhất: `orders.total` (post-discount, post-shipping) cho orders KHÔNG `cancelledAt`. Cùng định nghĩa với `getFinancialStats`.
- "Lợi nhuận": `orders.profit` (đã tính server-side trong order flow). Order items có `lineProfit`.
- `orders.createdBy` ref `profiles.id` → joins lấy `profiles.fullName` làm nhân viên bán.
- `payments.method` enum: `cash | bank_transfer | card`.
- No `returns` table → doanh thu KHÔNG trừ hoàn hàng. Note rõ ở UI footer.

## Requirements
**Functional** (chung cho 5 báo cáo)
- Filter: kỳ (start/end), so sánh kỳ trước (toggle), search dimension (tùy báo cáo).
- KPI cards: 4-5 metrics (revenue / profit / order count / aov / discount).
- Chart: trend line/area theo dimension chính (time/staff/product...).
- Table: phân trang server-side, default 20.
- Drill-down: click row → sheet danh sách order trong kỳ thuộc dimension đó (link tới `/orders/{id}`).
- Export: CSV (summary) / CSV detail / XLSX.

**Non-functional**
- Mỗi file <200 LOC. `report-sales.server.ts` dự kiến vượt → split sub-file per report nếu cần.

## Architecture

### Report 3.1 — `sales/by-time` Doanh thu theo thời gian
- **Route**: `/reports/sales/by-time` & `GET /api/admin/reports/sales/by-time[?startDate&endDate&groupBy=day|week|month&compare]`
- **SQL**: `SELECT to_char(date_trunc(:gb, created_at), :fmt) period, SUM(total) revenue, SUM(profit) profit, COUNT(*) order_count, SUM(total - profit) cogs FROM orders WHERE created_at BETWEEN ... AND cancelled_at IS NULL GROUP BY 1 ORDER BY 1`
- **KPI**: Tổng doanh thu / Tổng lợi nhuận / Số đơn / AOV / % LN (gross margin)
- **Chart**: Line/area chart - Doanh thu + Lợi nhuận theo period (dùng shadcn `chart.tsx` + `ChartContainer`)
- **Table**: period | đơn | doanh thu | giá vốn | LN | LN%
- **Drill-down**: click period row → sheet list orders đó
- **Export columns**: Kỳ, Số đơn, Doanh thu, Giá vốn, Lợi nhuận, % LN

### Report 3.2 — `sales/by-staff` Doanh thu theo nhân viên
- **Route**: `/reports/sales/by-staff` & API tương ứng
- **SQL**: `SELECT p.id, p.full_name, COUNT(o.*) order_count, SUM(o.total) revenue, SUM(o.profit) profit FROM orders o LEFT JOIN profiles p ON p.id = o.created_by WHERE ... AND o.cancelled_at IS NULL GROUP BY p.id, p.full_name ORDER BY revenue DESC`
- **KPI**: Tổng đơn / Tổng doanh thu / Tổng LN / Nhân viên top
- **Chart**: Bar chart top 10 nhân viên theo doanh thu
- **Table**: nhân viên | role | số đơn | doanh thu | LN | LN% | AOV
- **Drill-down**: click staff → sheet orders by that staff in period
- **Export**: Nhân viên, Email, Số đơn, Doanh thu, Lợi nhuận, AOV

### Report 3.3 — `sales/by-product` Doanh thu theo sản phẩm/biến thể
- **Route**: `/reports/sales/by-product`
- **SQL**: `SELECT oi.variant_id, oi.product_name, oi.variant_name, oi.sku, SUM(oi.quantity) qty, SUM(oi.line_total) revenue, SUM(oi.line_cost) cogs, SUM(oi.line_profit) profit FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id WHERE o.created_at BETWEEN ... AND o.cancelled_at IS NULL GROUP BY 1,2,3,4 ORDER BY revenue DESC`
- **Filter**: kỳ + search (product name / sku) + groupBy `variant` (default) hoặc `product`
- **KPI**: Tổng SKU bán / Số lượng bán / Doanh thu / LN
- **Chart**: Horizontal bar top 10 sản phẩm theo doanh thu
- **Table**: SKU | tên SP | biến thể | SL bán | doanh thu | giá vốn | LN | LN%
- **Drill-down**: click row → sheet orders chứa SKU đó
- **Export**: SKU, Sản phẩm, Biến thể, SL, Doanh thu, Giá vốn, LN, LN%

### Report 3.4 — `sales/by-customer` Doanh thu theo khách hàng ⭐ NEW
- **Route**: `/reports/sales/by-customer` & `GET /api/admin/reports/sales/by-customer[?startDate&endDate&search&page&limit]`
- **SQL**: `SELECT p.id, p.full_name, p.phone, p.customer_code, COUNT(o.*) order_count, SUM(o.total) revenue, SUM(o.profit) profit, AVG(o.total) aov, MAX(o.created_at) last_order_at FROM orders o INNER JOIN profiles p ON p.id = o.customer_id WHERE o.cancelled_at IS NULL AND o.created_at BETWEEN :s AND :e AND p.role='customer' GROUP BY p.id, p.full_name, p.phone, p.customer_code ORDER BY revenue DESC`
- **Filter**: kỳ, search KH (tên/SĐT/code), page, limit
- **KPI**: Tổng KH có mua / Tổng doanh thu / Doanh thu TB/KH / KH top
- **Chart**: horizontal bar top 10 KH theo doanh thu
- **Table**: KH | code | SĐT | số đơn | doanh thu | LN | LN% | AOV | đơn gần nhất
- **Drill-down**: click row → sheet orders KH đó trong kỳ; click order → `/orders/{id}` mở tab mới
- **Export**: KH, Code, SĐT, Số đơn, Doanh thu, LN, AOV, Lần mua gần nhất
- **Note**: tương tự `customers/top-by-revenue` (phase 06), nhưng phase 06 focus filter dài hạn + segmentation, phase 03 focus snapshot doanh thu trong kỳ; có thể share helper `getCustomerRevenueAggregate`.

### Report 3.5 — `sales/by-order` Chi tiết theo đơn hàng (renumbered: was 3.4)
- **Route**: `/reports/sales/by-order`
- **SQL**: List orders trong kỳ + join customer + join staff
- **Filter**: kỳ, search (orderNumber/customer), trạng thái (paymentStatus, fulfillmentStatus)
- **KPI**: Tổng đơn / Doanh thu / Đã thu / Còn nợ / LN
- **Chart**: Pie/donut breakdown theo paymentStatus
- **Table**: Mã đơn | ngày | KH | NV | trạng thái TT | trạng thái GH | tổng | đã thu | nợ | LN — click → `/orders/{id}` mới tab
- **Export**: tất cả cột table + một số metadata

### Report 3.6 — `sales/payments-by-method` Thu tiền theo phương thức
- **Route**: `/reports/sales/payments-by-method`
- **SQL**: `SELECT p.method, COUNT(*) tx_count, SUM(p.amount) total FROM payments p INNER JOIN orders o ON o.id = p.order_id WHERE p.created_at BETWEEN ... AND o.cancelled_at IS NULL GROUP BY p.method`
- **Filter**: kỳ
- **KPI**: Tổng thu / Số giao dịch / Trung bình / Phương thức nhiều nhất
- **Chart**: Pie chart breakdown by method
- **Table**: Phương thức | số giao dịch | tổng tiền | % tổng | TB/giao dịch
- **Drill-down**: click method → sheet list payments
- **Export**: Phương thức, Số GD, Tổng, % Tổng

### Report 3.7 — `sales/payments-by-staff` Thu tiền theo nhân viên ⭐ NEW
- **Route**: `/reports/sales/payments-by-staff`, `GET /api/admin/reports/sales/payments-by-staff`
- **SQL**: `SELECT pr.id, pr.full_name, COUNT(p.*) tx_count, SUM(p.amount) total, COUNT(DISTINCT p.order_id) order_count FROM payments p LEFT JOIN profiles pr ON pr.id = p.collected_by INNER JOIN orders o ON o.id = p.order_id WHERE p.created_at BETWEEN :s AND :e AND o.cancelled_at IS NULL GROUP BY pr.id, pr.full_name ORDER BY total DESC`
- **Filter**: kỳ, search NV
- **KPI**: Tổng NV thu / Tổng tiền thu / Số GD / TB/NV
- **Chart**: Bar chart top 10 NV theo tổng thu
- **Table**: NV | số đơn liên quan | số GD | tổng thu | TB/GD
- **Drill-down**: click NV → sheet list payments NV đó trong kỳ
- **Export**: NV, Số đơn, Số GD, Tổng thu, TB
- **Note**: phụ thuộc `payments.collected_by` field. Nếu schema chưa có, fallback `orders.created_by` (NV bán) → ghi rõ approximation trong UI.

### Report 3.8 — `sales/payments-by-time` Thu tiền theo thời gian ⭐ NEW
- **Route**: `/reports/sales/payments-by-time`, `GET /api/admin/reports/sales/payments-by-time`
- **SQL**: `SELECT to_char(date_trunc(:gb, p.created_at), :fmt) period, COUNT(*) tx_count, SUM(p.amount) total, COUNT(DISTINCT p.order_id) order_count, SUM(CASE WHEN p.method='cash' THEN p.amount ELSE 0 END) cash_total, SUM(CASE WHEN p.method='bank_transfer' THEN p.amount ELSE 0 END) bank_total, SUM(CASE WHEN p.method='card' THEN p.amount ELSE 0 END) card_total FROM payments p INNER JOIN orders o ON o.id = p.order_id WHERE p.created_at BETWEEN :s AND :e AND o.cancelled_at IS NULL GROUP BY 1 ORDER BY 1`
- **Filter**: kỳ, groupBy `day|week|month`, compare period
- **KPI**: Tổng thu / Số GD / TB/ngày / Ngày peak
- **Chart**: Stacked area/bar theo period, breakdown theo method (cash/bank/card)
- **Table**: period | số GD | tiền mặt | chuyển khoản | thẻ | tổng
- **Drill-down**: click period → sheet payments trong period
- **Export**: Kỳ, Số GD, Tiền mặt, Chuyển khoản, Thẻ, Tổng

## Related Code Files

**Create — services**
- Split per-report (mỗi file <200 LOC):
  - `report-sales-by-time.server.ts`
  - `report-sales-by-staff.server.ts`
  - `report-sales-by-product.server.ts`
  - `report-sales-by-customer.server.ts` ⭐
  - `report-sales-by-order.server.ts`
  - `report-sales-payments-by-method.server.ts`
  - `report-sales-payments-by-staff.server.ts` ⭐
  - `report-sales-payments-by-time.server.ts` ⭐
  - `report-sales.server.ts` (barrel re-export)

**Create — API routes** (16 file: 8 main + 8 export)
- `apps/admin/app/api/admin/reports/sales/{by-time,by-staff,by-product,by-customer,by-order,payments-by-method,payments-by-staff,payments-by-time}/route.ts`
- `apps/admin/app/api/admin/reports/sales/{...}/export/route.ts`

**Create — UI pages** (overwrite phase-01 stubs)
- `apps/admin/app/(dashboard)/reports/sales/{by-time,by-staff,by-product,by-customer,by-order,payments-by-method,payments-by-staff,payments-by-time}/_content.tsx`
- (page.tsx 1-liner đã có từ phase-01)

**Create — client + shared components**
- `apps/admin/services/reports.client.ts` — bổ sung methods + types (file hiện 186 LOC → split nếu vượt 200, tạo `reports-sales.client.ts` import & re-export).
- `apps/admin/components/admin/reports/sales-trend-chart.tsx` (shared chart dùng cho by-time)
- `apps/admin/components/admin/reports/report-drilldown-orders-sheet.tsx` (shared sheet hiển thị danh sách order — dùng cho 3.2/3.3/3.5)

**Modify**
- `apps/admin/lib/report-formatters.ts` — thêm labels constants cho sales.

**Delete**: none

## Implementation Steps
1. **Service layer** (`report-sales-*.server.ts`):
   - Mỗi function trả về `{ data, summary, metadata?, period }` shape ổn định.
   - Pagination dùng `PAGINATION_DEFAULT` + `calculateMetadata`.
   - Period compare optional, dùng `previousPeriod` từ `report-shared`.
2. **API routes**: copy pattern từ `apps/admin/app/api/admin/reports/profit-loss/route.ts` (auth → parseRange → service → JSON / CSV / XLSX export).
3. **Client layer**: extend `reportsClient` object (hoặc tạo file `reports-sales.client.ts`).
4. **UI pages**: copy `profit-loss/_content.tsx` shell (range picker + compare toggle + KPI bar + chart + table + export menu). Mỗi report-specific config (columns, kpi items, chart spec) là local arrays.
5. **Drilldown sheet**: tạo 1 sheet reusable nhận `{ filter, period }` + endpoint config → fetch & render order list.
6. **Compile + lint sau mỗi sub-report**.

## Todo List
- [ ] `report-sales-by-time.server.ts`
- [ ] `report-sales-by-staff.server.ts`
- [ ] `report-sales-by-product.server.ts`
- [ ] `report-sales-by-customer.server.ts` ⭐
- [ ] `report-sales-by-order.server.ts`
- [ ] `report-sales-payments-by-method.server.ts`
- [ ] `report-sales-payments-by-staff.server.ts` ⭐
- [ ] `report-sales-payments-by-time.server.ts` ⭐
- [ ] `report-sales.server.ts` barrel
- [ ] 16 API routes (8 main + 8 export)
- [ ] 8 `_content.tsx` pages
- [ ] `reports.client.ts` extended (or split `reports-sales.client.ts`)
- [ ] `sales-trend-chart.tsx`
- [ ] `report-drilldown-orders-sheet.tsx`
- [ ] `report-drilldown-payments-sheet.tsx` (mới — dùng cho payments-by-*)
- [ ] Type-check + smoke test mỗi báo cáo
- [ ] Export CSV/XLSX verify mỗi báo cáo

## Success Criteria
- 8 báo cáo load < 2s với dữ liệu seed.
- KPI numbers tổng khớp giữa các báo cáo (e.g. sum revenue by-time = sum by-staff = by-product = by-customer = revenue trong P&L).
- Tổng `payments` trong payments-by-* (cùng kỳ) khớp 3 chiều: by-method total = by-staff total = by-time total.
- Export CSV mở được trong Excel, XLSX có format currency.
- Drill-down từ sản phẩm → orders chứa SKU, click → trang detail order.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Inconsistent revenue definition giữa các báo cáo | M | H | Định nghĩa thống nhất 1 helper `revenueExpr` trong `report-shared`; tất cả gọi cùng expression |
| `orders.profit` chưa được set ở các đơn cũ → LN sai | M | M | Backfill check ở phase 07; fallback compute `total - totalCost` |
| `created_by` null (đơn pre-staff-tracking) | M | M | LEFT JOIN + nhóm "Chưa rõ NV" |
| Order item `lineProfit` không cập nhật khi sửa giá | L | M | Note "snapshot at order time" trong UI |
| Aggregate query chậm khi N>50k orders | M | M | Confirm index `idx_orders_created` (đã có); thêm partial index `WHERE cancelled_at IS NULL` nếu cần ở phase 07 |
| Sales file vượt 200 LOC | H | M | Split sub-file pattern (đã plan) |

## Security
- Auth: `requireApiUser(request, "owner")` (giống pattern hiện có). Phase 07 quyết định mở manager.
- Validate `startDate <= endDate` ở `parseDateRange` (đã có).
- Không expose `costPrice` / `profit` cho role staff (nếu mở manager phase 07).

## Rollback Plan
- Routes mới hoàn toàn isolated; xóa thư mục `sales/` ở `(dashboard)/reports/` + `api/admin/reports/` là revert.
- Sidebar/hub revert ở phase 01 (đã có constants vẫn tồn tại nhưng 404 → giảm độ ưu tiên sidebar).

## Next Steps
- Phase 04 (purchases) reuse cùng patterns.
