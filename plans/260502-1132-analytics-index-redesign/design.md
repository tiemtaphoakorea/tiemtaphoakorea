# Analytics Index Page Redesign — Design Spec

- **Date:** 2026-05-02
- **Branch:** dev
- **Scope:** `apps/admin/app/(dashboard)/analytics/_content.tsx`
- **Sub-pages giữ nguyên:** `/overview`, `/finance`, `/finance/detail`, `/products`, `/inventory`

---

## 1. Vấn đề (current state)

Trang `/analytics` đang có 6 cards với data trùng lặp:

| # | Card | Trỏ tới | Giá trị | Vấn đề |
|---|------|---------|---------|--------|
| 1 | Doanh thu theo ngày | `/finance/detail` | 12.4tr · 47 đơn | Trùng card 3 |
| 2 | Doanh thu theo tháng | `/finance` | 125.4tr · 542 đơn | Trùng card 4 (cùng giá trị) |
| 3 | Đơn hàng theo ngày | `/finance/detail` | 47 đơn · 12.4tr | Cùng đích & data với card 1, đảo vị trí |
| 4 | Tổng hợp doanh thu | `/overview` | 125.4tr | Cùng giá trị card 2 |
| 5 | Doanh thu theo SP | `/products` | 8 sản phẩm | OK |
| 6 | KPI & Mục tiêu | `/overview` | 83.6% | Trỏ trùng card 4, không có sub-page riêng, không có data thực |

Ngoài ra:
- Thiếu hẳn card cho `/inventory`.
- Mỗi card chỉ là static metric, không có chart/list ý nghĩa.
- Bar chart "Doanh thu 5 tháng" cuối page lặp với `RevenueChart` 12 tháng ở `/overview`.

---

## 2. Mục tiêu (goals)

1. Mỗi card đảm nhiệm 1 nhiệm vụ riêng biệt — không trùng lẫn nhau.
2. Không lặp dashboard `/` (snapshot today/realtime).
3. Không lặp full content sub-pages.
4. Mỗi card có 1 mini-visualization (chart hoặc list rút gọn) thay vì 1 con số tĩnh.
5. Map 1-1 với sub-pages (gộp `/finance` + `/finance/detail` vào 1 card chung) → **4 cards**.

### Phân định trách nhiệm với dashboard `/`

| Trang | Focus | Time |
|-------|-------|------|
| Dashboard `/` | KPI thời gian thực, hành động cần làm hôm nay | Today / 7 ngày |
| Analytics `/analytics` | Báo cáo phân tích, trends, cơ cấu | Tháng / 30 ngày / 6 tháng |

→ Index analytics **không** show "Doanh thu hôm nay", "Đơn chờ", "SP sắp hết hôm nay" (đã có ở dashboard).

---

## 3. Design

### 3.1 Layout

4-card grid responsive:
- Mobile: 1 col
- Tablet (md): 2 cols
- Desktop (lg): 2 cols × 2 rows (cards rộng hơn để mini-viz dễ đọc)

Bỏ section "Doanh thu 5 tháng" ở cuối page → trang chỉ còn 4 cards.

### 3.2 Card 1 — Tổng hợp doanh thu

- **Sub-page:** `/analytics/overview`
- **Mục đích:** Cơ cấu doanh thu theo danh mục — preview top
- **Visualization:** Donut chart 4 segments (top 3 danh mục + "Khác")
- **Layout:**
  ```
  ┌─────────────────────────────────────────┐
  │ [icon] Tổng hợp doanh thu             › │
  │ Cơ cấu DT theo danh mục                 │
  │                                         │
  │     ╭────╮     ▪ Áo    42%  52.7tr     │
  │     │    │     ▪ Quần  28%  35.1tr     │
  │     ╰────╯     ▪ PK    18%  22.6tr     │
  │                ▪ Khác  12%  15.0tr     │
  └─────────────────────────────────────────┘
  ```
- **Tránh trùng:** `/overview` có `CategorySalesChart` đầy đủ tất cả danh mục — card chỉ top 3.
- **Data source:** `data.categorySales` từ `adminClient.getAnalytics()` (đã có).

### 3.3 Card 2 — Tài chính & Doanh thu

- **Sub-page:** `/analytics/finance` (gộp luôn lối vào `/finance/detail`)
- **Mục đích:** Trend doanh thu 30 ngày + margin tháng
- **Visualization:** Line chart 30 ngày + label margin gauge
- **Layout:**
  ```
  ┌─────────────────────────────────────────┐
  │ [icon] Tài chính & Doanh thu          › │
  │ Lợi nhuận và DT 30 ngày qua             │
  │                                         │
  │ Margin T5: 25.6%  +2.3pt vs T4         │
  │                                         │
  │       ╭─╮      ╭──╮                    │
  │   ╭──╯  ╰─╮ ╭─╯  ╰──╮  ╭───╮          │
  │ ──╯       ╰─╯       ╰──╯   ╰──         │
  │ T4-3                            T5-2    │
  └─────────────────────────────────────────┘
  ```
- **Tránh trùng:**
  - `/finance` show breakdown 1 tháng (DT/COGS/Profit) — card show trend nhiều ngày.
  - `/finance/detail` là bảng table per ngày — card là line chart visual.
- **Data source:**
  - Daily revenue 30 ngày: cần extend API hoặc tính client-side.
  - Margin tháng: từ finance stats hiện có.

### 3.4 Card 3 — Sản phẩm bán chạy

- **Sub-page:** `/analytics/products`
- **Mục đích:** Top 3 SP bán chạy tháng này
- **Visualization:** List 3 dòng với progress bar
- **Layout:**
  ```
  ┌─────────────────────────────────────────┐
  │ [icon] Sản phẩm bán chạy              › │
  │ Top 3 tháng này                         │
  │                                         │
  │ 1  Áo thun cotton    ██████████░  42%  │
  │ 2  Quần jean slim    ███████░░░░  28%  │
  │ 3  Túi tote canvas   ████░░░░░░░  18%  │
  └─────────────────────────────────────────┘
  ```
- **Tránh trùng:** `/products` có full ranking 8+ SP với detail đầy đủ — card chỉ top 3.
- **Data source:** `data.topProducts.slice(0, 3)` từ `adminClient.getAnalytics()` (đã có).

### 3.5 Card 4 — Tồn kho cảnh báo

- **Sub-page:** `/analytics/inventory`
- **Mục đích:** Alert nhanh tồn kho nóng
- **Visualization:** Số tổng + 2 SP nóng nhất
- **Layout:**
  ```
  ┌─────────────────────────────────────────┐
  │ [icon] Tồn kho cảnh báo               › │
  │ 8 SP cần xử lý                          │
  │                                         │
  │ 🔴 Áo thun M trắng        đã hết       │
  │ 🟡 Quần jean L            còn 2        │
  │                                         │
  │ + 6 SP khác                            │
  └─────────────────────────────────────────┘
  ```
- **Tránh trùng:** `/inventory` có 5 stats + Low/Out-of-stock list đầy đủ — card chỉ alert quick-view 2 SP nóng nhất.
- **Data source:** `adminClient.getStockAlerts()` (đã có) — `outOfStock` ưu tiên hiển thị, fallback `lowStock`.

---

## 4. Loại bỏ (removals)

| Mục | Lý do |
|-----|-------|
| Card "Doanh thu theo ngày" cũ | Gộp vào Card 2 (Tài chính & Doanh thu) |
| Card "Doanh thu theo tháng" cũ | Gộp vào Card 2 |
| Card "Đơn hàng theo ngày" cũ | Trùng card "Doanh thu theo ngày" |
| Card "KPI & Mục tiêu" cũ | Không có sub-page, không có data thực (YAGNI) |
| Bar chart "Doanh thu 5 tháng" cuối page | Đã có ở `/overview` (RevenueChart 12 tháng) |
| Constant `MONTHLY` array | Không dùng nữa |
| Import `BarChartMini` | Bỏ nếu không còn dùng trong file |

---

## 5. Files affected

### Modify
- `apps/admin/app/(dashboard)/analytics/_content.tsx` — rewrite từ 6 card thành 4 card có mini-viz, mỗi card 1 sub-component
- `packages/database/src/services/analytics.server.ts` — extend `categorySales` thêm `revenue` field (sum `orderItems.lineTotal` per category)

### Create
- `apps/admin/components/admin/analytics/index-card-revenue-mix.tsx` — Card 1 donut (recharts PieChart)
- `apps/admin/components/admin/analytics/index-card-finance-trend.tsx` — Card 2 line + margin (recharts AreaChart/LineChart)
- `apps/admin/components/admin/analytics/index-card-top-products.tsx` — Card 3 top 3 list
- `apps/admin/components/admin/analytics/index-card-stock-alert.tsx` — Card 4 alert summary

### Reuse
- Style theo pattern `RevenueChart` (recharts AreaChart với gradient + custom tooltip).
- Card wrapper, icon classes, `ChevronRight` indicator giữ nguyên từ design hiện tại.

---

## 6. Data requirements

Tất cả cards dùng API thực, không mock.

| Card | API call | Trường dùng |
|------|---------|-------------|
| 1. Donut cơ cấu | `adminClient.getAnalytics()` | `categorySales[].{category, sales, color}` (top 3 + Khác) — xem ghi chú dưới |
| 2. Line 30 ngày + margin | `adminClient.getDailyFinancialStats({startDate, endDate})` (range = 30 ngày trước → today) **+** `adminClient.getFinancialStats({month, year})` × 2 (tháng hiện tại + tháng trước) | `dailyData[].{date, revenue}` + `stats.{revenue, netProfit}` để tính margin = `netProfit / revenue × 100` |
| 3. Top 3 SP | `adminClient.getAnalytics()` | `topProducts.slice(0,3).{name, sales, revenue}` |
| 4. Cảnh báo kho | `adminClient.getStockAlerts()` | `outOfStock[]` ưu tiên trước, `lowStock[]` fill còn lại; mỗi item `{id, productName, name (variant), onHand}` |

### Ghi chú Card 1

`categorySales[].sales` hiện trả **số đơn (count of orderItems)**, không phải doanh thu (xem `analytics.server.ts:71`).

→ 2 lựa chọn:
- **A) Đổi label card** thành "Cơ cấu đơn theo danh mục" (truthful với data hiện tại, không sửa backend).
- **B) Extend `getAnalyticsData()`** thêm field `revenue` per category (`sum(orderItems.lineTotal)` thay vì `count`), giữ label "Cơ cấu doanh thu".

→ **Chọn B** — sửa nhỏ ở `analytics.server.ts`, đồng nhất ngôn ngữ "doanh thu" xuyên suốt page báo cáo. Sẽ chi tiết trong implementation plan.

### Chart library

Dự án đã có `recharts ^2.15.4` (cả `apps/admin` lẫn `packages/ui`).

| Card | Recharts component |
|------|-----|
| 1 | `PieChart` (donut variant với `innerRadius`) |
| 2 | `LineChart` hoặc `AreaChart` (giống style `RevenueChart` hiện có) |
| 3 | Không cần recharts — list + progress bar markup |
| 4 | Không cần recharts — text + alert markup |

---

## 7. Loading & empty states

- Mỗi card: skeleton placeholder khớp shape mini-viz khi `isLoading`.
- Empty: nếu data rỗng thì show empty message tinh tế trong card (không ẩn cả card) để giữ layout 4 cards.
- Error: hiển thị "Lỗi tải dữ liệu" thay cho mini-viz, nhưng vẫn click được vào sub-page.

---

## 8. Click behavior

- Cả card clickable → điều hướng sang sub-page tương ứng (giữ pattern hiện tại với `<Link>` wrap toàn card).
- Không có inner clickable areas (giữ KISS — chi tiết nằm ở sub-page).
- Card 2: chỉ trỏ tới `/finance` (không trỏ trực tiếp `/finance/detail`); button "Chi tiết theo ngày" đã có sẵn trong `/finance` page.

---

## 9. Out of scope

- Không tạo sub-page mới (giữ nguyên 5 sub-pages hiện có).
- Không thay đổi UI sub-pages.
- Không thay đổi dashboard `/`.
- Không thay đổi navigation/layout admin.

---

## 10. Open questions

Không còn — đã verify:
- Daily revenue 30 ngày: dùng `getDailyFinancialStats` đã có.
- Chart lib: dùng `recharts` đã cài sẵn.
- Toàn bộ cards dùng real API, không mock (chỉ extend nhỏ `analytics.server.ts` cho `categorySales.revenue` ở Card 1).
