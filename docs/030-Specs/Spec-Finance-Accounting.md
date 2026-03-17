---
id: SPEC-015
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Finance & Accounting

## Related Epics

- [[Epic-09-Accounting]]
- [[Epic-07-Payment]]


## Module Notes

### Module 7 & 9: Tài Chính & Kế Toán (Finance & Accounting)

**Mục tiêu**: Quản lý dòng tiền, công nợ và tính Lợi Nhuận (P&L).

---

#### 1. Tính Năng (Features)

- **7.1 Payment Tracking**:
  - Ghi nhận thanh toán từng phần cho đơn hàng (Partial Payment/Deposit).
  - Phương thức: Cash, Transfer.
- **9.1 Cost Management**:
  - Quản lý Cost Price (Giá vốn hàng bán - COGS).
  - Quản lý Operating Expenses (Chi phí vận hành: Mặt bằng, nhân sự...).
- **9.2 Reports**:
  - Doanh thu (Revenue).
  - Lợi nhuận (Profit = Revenue - COGS - Expenses).

---

#### 2. Thiết Kế (Design)

##### UI Components

- **FinanceDashboard**: Charts (Revenue vs Profit).
- **PaymentModal**: Attach vào Order Detail để add payment record.
- **ExpenseList**: CRUD Chi phí.

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Payment Update

- `Order Total`: $100.
- Add Payment 1 (Deposit): $30 -> Order Status: `Partial Paid`. Debt: $70.
- Add Payment 2 (COD): $70 -> Order Status: `Paid`. Debt: $0.

##### 3.2 P&L Calculation

- **Gross Profit** (Lãi gộp) = `Order Items Total` - `Total Cost Base` (Sum of variants cost).
- **Net Profit** (Lãi ròng) = `Gross Profit` - `Operating Expenses` (trong kỳ).

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`payments` (New)**:
  - `order_id` FK.
  - `amount`.
  - `created_at`.
- **`expenses` (New)**:
  - `amount`
  - `type` (fixed/variable).
  - `date`.


## Feature Details

### F06: Kế toán Đơn giản

#### 1. Tổng quan

Module kế toán đơn giản cung cấp các tính năng theo dõi giá vốn, tính toán lợi nhuận và báo cáo tài chính cơ bản cho shop. Không phải là hệ thống kế toán đầy đủ mà tập trung vào việc giúp chủ shop nắm được lãi/lỗ.

##### 1.1 Phạm vi

- Theo dõi giá vốn (cost_price) cho từng variant sản phẩm
- Lưu lịch sử thay đổi giá vốn
- Tính toán lợi nhuận tự động cho mỗi đơn hàng
- Báo cáo doanh thu, lợi nhuận theo ngày/tuần/tháng
- Tính toán tỷ suất lợi nhuận (profit margin)

##### 1.2 Actors

| Actor | Mô tả |
|-------|-------|
| Admin (Owner) | Xem báo cáo tài chính, cập nhật giá vốn |

**Lưu ý:** Thông tin giá vốn và lợi nhuận chỉ Admin được xem, không hiển thị cho Customer.

---

#### 2. User Stories

##### US-06-01: Cập nhật giá vốn sản phẩm
**Là** Admin  
**Tôi muốn** cập nhật giá vốn khi nhập hàng mới  
**Để** tính toán lợi nhuận chính xác

**Acceptance Criteria:**
- Nhập giá vốn mới cho variant
- Hệ thống tự động lưu giá vốn cũ vào lịch sử
- Đơn hàng cũ vẫn giữ giá vốn tại thời điểm mua

##### US-06-02: Xem lịch sử giá vốn
**Là** Admin  
**Tôi muốn** xem lịch sử thay đổi giá vốn  
**Để** theo dõi biến động giá nhập

**Acceptance Criteria:**
- Hiển thị các lần thay đổi giá vốn theo thời gian
- Hiển thị: giá cũ, giá mới, ngày thay đổi
- Lọc theo sản phẩm/variant

##### US-06-03: Xem lợi nhuận đơn hàng
**Là** Admin  
**Tôi muốn** xem lợi nhuận từng đơn hàng  
**Để** biết được lãi cụ thể

**Acceptance Criteria:**
- Hiển thị: doanh thu, giá vốn, lợi nhuận, % lợi nhuận
- Lợi nhuận = Doanh thu - Tổng giá vốn
- Sử dụng giá vốn tại thời điểm đặt hàng

##### US-06-04: Báo cáo doanh thu theo thời gian
**Là** Admin  
**Tôi muốn** xem báo cáo doanh thu theo ngày/tuần/tháng  
**Để** nắm được tình hình kinh doanh

**Acceptance Criteria:**
- Chọn khoảng thời gian
- Hiển thị: tổng doanh thu, tổng giá vốn, tổng lợi nhuận
- Biểu đồ xu hướng theo thời gian

##### US-06-05: Báo cáo lợi nhuận theo sản phẩm
**Là** Admin  
**Tôi muốn** xem sản phẩm nào mang lại lợi nhuận cao nhất  
**Để** tối ưu chiến lược bán hàng

**Acceptance Criteria:**
- Danh sách sản phẩm theo tổng lợi nhuận
- Hiển thị: số lượng bán, doanh thu, lợi nhuận
- Sắp xếp theo lợi nhuận cao nhất

---

#### 3. Cơ chế tính toán

##### 3.1 Giá vốn (Cost Price)

```
┌────────────────────────────────────────────────────────────────────┐
│                   CƠ CHẾ GIÁ VỐN                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PRODUCT_VARIANTS                                                  │
│  ├── cost_price: Giá vốn hiện tại                                 │
│  └── (Cập nhật khi nhập hàng mới)                                 │
│                                                                    │
│  COST_PRICE_HISTORY                                                │
│  ├── variant_id: ID variant                                       │
│  ├── old_price: Giá vốn trước đó                                  │
│  ├── new_price: Giá vốn mới                                       │
│  └── changed_at: Thời điểm thay đổi                               │
│                                                                    │
│  ORDER_ITEMS                                                       │
│  └── cost_price_at_order_time: Snapshot giá vốn                   │
│      (Lấy từ variant.cost_price tại thời điểm tạo đơn)           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

##### 3.2 Công thức tính lợi nhuận

```
Cấp độ Order Item (dòng sản phẩm):
───────────────────────────────────
item_revenue = quantity × unit_price
item_cost = quantity × cost_price_at_order_time
item_profit = item_revenue - item_cost

Cấp độ Order (đơn hàng):
─────────────────────────
subtotal = Σ(item_revenue)      // Tổng doanh thu
total_cost = Σ(item_cost)        // Tổng giá vốn
profit = subtotal - total_cost   // Lợi nhuận

profit_margin = (profit / subtotal) × 100%  // Tỷ suất lợi nhuận
```

##### 3.3 Ví dụ minh họa

```
Đơn hàng ORD-20251230-001:
┌────────────────────────────────────────────────────────────────────┐
│ Sản phẩm          │ SL │ Giá bán  │ Giá vốn  │ Doanh thu│ Chi phí │
├───────────────────┼────┼──────────┼──────────┼──────────┼─────────┤
│ Son MAC Ruby Woo  │ 2  │ 450,000đ │ 300,000đ │ 900,000đ │ 600,000đ│
│ Kem dưỡng XYZ     │ 1  │ 300,000đ │ 180,000đ │ 300,000đ │ 180,000đ│
├───────────────────┼────┼──────────┼──────────┼──────────┼─────────┤
│ TỔNG              │ 3  │          │          │1,200,000đ│ 780,000đ│
└───────────────────┴────┴──────────┴──────────┴──────────┴─────────┘

Lợi nhuận = 1,200,000 - 780,000 = 420,000đ
Tỷ suất = 420,000 / 1,200,000 = 35%
```

---

#### 4. Thiết kế Database

##### 4.1 Bảng cost_price_history

```sql
CREATE TABLE cost_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  old_price DECIMAL(12,2) NOT NULL,
  new_price DECIMAL(12,2) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_cost_price_history_variant 
  ON cost_price_history(variant_id);
CREATE INDEX idx_cost_price_history_date 
  ON cost_price_history(changed_at);
```

##### 4.2 Trigger tự động lưu lịch sử

```sql
-- Function to log cost price changes
CREATE OR REPLACE FUNCTION log_cost_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if cost_price actually changed
  IF OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
    INSERT INTO cost_price_history (
      variant_id, 
      old_price, 
      new_price,
      changed_by
    ) VALUES (
      NEW.id,
      COALESCE(OLD.cost_price, 0),
      NEW.cost_price,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on product_variants
CREATE TRIGGER trigger_cost_price_change
  AFTER UPDATE OF cost_price ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION log_cost_price_change();
```

##### 4.3 Bảng daily_reports (Cache báo cáo)

```sql
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  total_profit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
```

##### 4.4 Trigger cập nhật daily_reports

```sql
-- Function to update daily report
CREATE OR REPLACE FUNCTION update_daily_report()
RETURNS TRIGGER AS $$
DECLARE
  order_date DATE;
BEGIN
  -- Determine which date to update
  IF TG_OP = 'DELETE' THEN
    order_date := OLD.created_at::DATE;
  ELSE
    order_date := NEW.created_at::DATE;
  END IF;

  -- Recalculate daily totals
  INSERT INTO daily_reports (
    report_date,
    total_orders,
    total_revenue,
    total_cost,
    total_profit
  )
  SELECT 
    order_date,
    COUNT(*),
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(total_cost), 0),
    COALESCE(SUM(profit), 0)
  FROM orders
  WHERE created_at::DATE = order_date
    AND status = 'delivered'
  ON CONFLICT (report_date) 
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    total_cost = EXCLUDED.total_cost,
    total_profit = EXCLUDED.total_profit,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on orders
CREATE TRIGGER trigger_update_daily_report
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_report();
```

---

#### 5. Thiết kế UI

##### 5.1 Dashboard Tài chính

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BÁO CÁO TÀI CHÍNH                           [Hôm nay ▼] [Xuất Excel]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│ │    DOANH THU    │ │    GIÁ VỐN      │ │   LỢI NHUẬN     │            │
│ │                 │ │                 │ │                 │            │
│ │  15,500,000đ    │ │  10,075,000đ    │ │  5,425,000đ     │            │
│ │  ↑ 12% vs hôm qua│ │                 │ │  Margin: 35%    │            │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘            │
│                                                                         │
│ BIỂU ĐỒ DOANH THU & LỢI NHUẬN (7 ngày gần nhất)                        │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │  20M ┤                                              ████            │ │
│ │      │                              ████           █████            │ │
│ │  15M ┤               ████          █████  ████    ██████            │ │
│ │      │      ████    █████  ████   ██████  █████   ███████           │ │
│ │  10M ┤     █████   ██████  █████  ███████ ██████  ████████          │ │
│ │      │    ██████   ███████ ██████ ████████████████████████          │ │
│ │   5M ┤   ███████  ████████████████████████████████████████          │ │
│ │      │  ████████████████████████████████████████████████████        │ │
│ │   0  └──────────────────────────────────────────────────────        │ │
│ │        24/12  25/12  26/12  27/12  28/12  29/12  30/12              │ │
│ │                                                                     │ │
│ │        ████ Doanh thu    ████ Lợi nhuận                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ TOP SẢN PHẨM LỢI NHUẬN CAO                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #  │ Sản phẩm              │ SL bán │ Doanh thu   │ Lợi nhuận      │ │
│ ├────┼───────────────────────┼────────┼─────────────┼────────────────┤ │
│ │ 1  │ Son MAC Ruby Woo      │ 45     │ 20,250,000đ │ 6,750,000đ     │ │
│ │ 2  │ Kem dưỡng XYZ Night   │ 32     │ 9,600,000đ  │ 3,840,000đ     │ │
│ │ 3  │ Serum ABC Vitamin C   │ 28     │ 8,400,000đ  │ 3,360,000đ     │ │
│ │ 4  │ Toner DEF Hyaluronic  │ 25     │ 5,000,000đ  │ 2,000,000đ     │ │
│ │ 5  │ Sữa rửa mặt GHI       │ 40     │ 4,000,000đ  │ 1,600,000đ     │ │
│ └────┴───────────────────────┴────────┴─────────────┴────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 5.2 Lịch sử giá vốn

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LỊCH SỬ GIÁ VỐN                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [🔍 Tìm sản phẩm...                                          ] [Lọc]  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Thời gian        │ Sản phẩm (SKU)       │ Giá cũ    │ Giá mới      │ │
│ ├──────────────────┼──────────────────────┼───────────┼──────────────┤ │
│ │ 30/12/25 09:00   │ Son MAC (MAC-001)    │ 280,000đ  │ 300,000đ ↑   │ │
│ │ 28/12/25 14:30   │ Kem XYZ (XYZ-01)     │ 200,000đ  │ 180,000đ ↓   │ │
│ │ 25/12/25 10:15   │ Serum ABC (ABC-01)   │ 150,000đ  │ 160,000đ ↑   │ │
│ │ 20/12/25 16:45   │ Toner DEF (DEF-01)   │ 100,000đ  │ 100,000đ     │ │
│ └──────────────────┴──────────────────────┴───────────┴──────────────┘ │
│                                                                         │
│                                       [◄ Trước] Trang 1/5 [Tiếp ►]     │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 5.3 Chi tiết lợi nhuận đơn hàng

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CHI TIẾT LỢI NHUẬN - ORD-20251230-002                             [X] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Khách hàng: KH001 - Nguyễn Thị Hương                                   │
│ Ngày đặt: 30/12/2025 09:15                                             │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Sản phẩm          │ SL │ Giá bán   │ Giá vốn   │ Doanh thu│ Lợi nhuận│
│ ├───────────────────┼────┼───────────┼───────────┼──────────┼──────────┤ │
│ │ Son MAC Ruby Woo  │ 2  │ 450,000đ  │ 300,000đ  │ 900,000đ │ 300,000đ │ │
│ │ Kem dưỡng XYZ     │ 1  │ 300,000đ  │ 180,000đ  │ 300,000đ │ 120,000đ │ │
│ └───────────────────┴────┴───────────┴───────────┴──────────┴──────────┘ │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│                                                                         │
│                               TỔNG DOANH THU:     1,200,000đ           │
│                               TỔNG GIÁ VỐN:         780,000đ           │
│                               ───────────────────────────────           │
│                               TỔNG LỢI NHUẬN:       420,000đ           │
│                               TỶ SUẤT:                   35%           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 5.4 Báo cáo theo khoảng thời gian

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BÁO CÁO TỔNG HỢP                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Thời gian: [01/12/2025] đến [31/12/2025]                   [Xem báo cáo]│
│                                                                         │
│ ═══════════════════════════════════════════════════════════════════════ │
│                                                                         │
│ TỔNG QUAN THÁNG 12/2025                                                │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │   Tổng đơn hàng:           156 đơn                                 │ │
│ │   Đơn hoàn thành:          142 đơn (91%)                           │ │
│ │   Đơn hủy:                  14 đơn (9%)                            │ │
│ │                                                                     │ │
│ │   ─────────────────────────────────────────────────────────────    │ │
│ │                                                                     │ │
│ │   Tổng doanh thu:          156,800,000đ                            │ │
│ │   Tổng giá vốn:            101,920,000đ                            │ │
│ │   Tổng lợi nhuận:           54,880,000đ                            │ │
│ │                                                                     │ │
│ │   Tỷ suất lợi nhuận:              35%                              │ │
│ │   Doanh thu TB/đơn:         1,104,225đ                             │ │
│ │   Lợi nhuận TB/đơn:           386,479đ                             │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ PHÂN TÍCH THEO TUẦN                                                     │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Tuần        │ Đơn hàng │ Doanh thu    │ Giá vốn      │ Lợi nhuận   │ │
│ ├─────────────┼──────────┼──────────────┼──────────────┼─────────────┤ │
│ │ 01-07/12    │ 32       │ 35,200,000đ  │ 22,880,000đ  │ 12,320,000đ │ │
│ │ 08-14/12    │ 38       │ 41,800,000đ  │ 27,170,000đ  │ 14,630,000đ │ │
│ │ 15-21/12    │ 35       │ 38,500,000đ  │ 25,025,000đ  │ 13,475,000đ │ │
│ │ 22-28/12    │ 45       │ 49,500,000đ  │ 32,175,000đ  │ 17,325,000đ │ │
│ │ 29-31/12    │ 12       │ 13,200,000đ  │  8,580,000đ  │  4,620,000đ │ │
│ └─────────────┴──────────┴──────────────┴──────────────┴─────────────┘ │
│                                                                         │
│                                                    [📥 Xuất Excel]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 6. Triển khai kỹ thuật

##### 6.1 API Routes

```
app/routes/
├── admin.reports._index.tsx        # Dashboard tài chính
├── admin.reports.revenue.tsx       # Báo cáo doanh thu
├── admin.reports.profit.tsx        # Báo cáo lợi nhuận
├── admin.reports.cost-history.tsx  # Lịch sử giá vốn
└── admin.reports.export.tsx        # Xuất báo cáo Excel
```

##### 6.2 Code Implementation

###### Lấy báo cáo theo khoảng thời gian

```typescript
// app/models/report.server.ts

interface ReportSummary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  avgRevenuePerOrder: number;
  avgProfitPerOrder: number;
}

export async function getReportSummary(
  supabase: SupabaseClient,
  dateFrom: Date,
  dateTo: Date
): Promise<ReportSummary> {
  // Get delivered orders in date range
  const { data: deliveredOrders, error: deliveredError } = await supabase
    .from('orders')
    .select('subtotal, total_cost, profit')
    .eq('status', 'delivered')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  if (deliveredError) throw deliveredError;

  // Get all orders count
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  // Get cancelled orders count
  const { count: cancelledOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  // Calculate totals
  const totalRevenue = deliveredOrders?.reduce(
    (sum, o) => sum + (o.subtotal || 0), 0
  ) || 0;
  
  const totalCost = deliveredOrders?.reduce(
    (sum, o) => sum + (o.total_cost || 0), 0
  ) || 0;
  
  const totalProfit = deliveredOrders?.reduce(
    (sum, o) => sum + (o.profit || 0), 0
  ) || 0;

  const deliveredCount = deliveredOrders?.length || 0;

  return {
    totalOrders: totalOrders || 0,
    deliveredOrders: deliveredCount,
    cancelledOrders: cancelledOrders || 0,
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin: totalRevenue > 0 
      ? (totalProfit / totalRevenue) * 100 
      : 0,
    avgRevenuePerOrder: deliveredCount > 0 
      ? totalRevenue / deliveredCount 
      : 0,
    avgProfitPerOrder: deliveredCount > 0 
      ? totalProfit / deliveredCount 
      : 0
  };
}
```

###### Lấy doanh thu theo ngày (cho biểu đồ)

```typescript
// app/models/report.server.ts

interface DailyRevenue {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

export async function getDailyRevenue(
  supabase: SupabaseClient,
  dateFrom: Date,
  dateTo: Date
): Promise<DailyRevenue[]> {
  // Try to get from cached daily_reports first
  const { data: cached } = await supabase
    .from('daily_reports')
    .select('*')
    .gte('report_date', dateFrom.toISOString().split('T')[0])
    .lte('report_date', dateTo.toISOString().split('T')[0])
    .order('report_date', { ascending: true });

  if (cached?.length) {
    return cached.map(r => ({
      date: r.report_date,
      revenue: r.total_revenue,
      cost: r.total_cost,
      profit: r.total_profit,
      orderCount: r.total_orders
    }));
  }

  // Fallback: Calculate from orders table
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, subtotal, total_cost, profit')
    .eq('status', 'delivered')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  // Group by date
  const dailyMap = new Map<string, DailyRevenue>();
  
  for (const order of orders || []) {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(date) || {
      date,
      revenue: 0,
      cost: 0,
      profit: 0,
      orderCount: 0
    };

    dailyMap.set(date, {
      date,
      revenue: existing.revenue + (order.subtotal || 0),
      cost: existing.cost + (order.total_cost || 0),
      profit: existing.profit + (order.profit || 0),
      orderCount: existing.orderCount + 1
    });
  }

  return Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

###### Top sản phẩm theo lợi nhuận

```typescript
// app/models/report.server.ts

interface ProductProfit {
  variantId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export async function getTopProductsByProfit(
  supabase: SupabaseClient,
  dateFrom: Date,
  dateTo: Date,
  limit: number = 10
): Promise<ProductProfit[]> {
  const { data, error } = await supabase
    .rpc('get_product_profit_report', {
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      result_limit: limit
    });

  if (error) throw error;

  return data || [];
}
```

###### Stored Procedure cho báo cáo sản phẩm

```sql
-- Function to get product profit report
CREATE OR REPLACE FUNCTION get_product_profit_report(
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  variant_id UUID,
  product_name TEXT,
  sku VARCHAR,
  quantity_sold BIGINT,
  total_revenue DECIMAL,
  total_cost DECIMAL,
  total_profit DECIMAL,
  profit_margin DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.variant_id,
    p.name::TEXT AS product_name,
    pv.sku,
    SUM(oi.quantity)::BIGINT AS quantity_sold,
    SUM(oi.subtotal) AS total_revenue,
    SUM(oi.quantity * oi.cost_price_at_order_time) AS total_cost,
    SUM(oi.subtotal) - SUM(oi.quantity * oi.cost_price_at_order_time) AS total_profit,
    CASE 
      WHEN SUM(oi.subtotal) > 0 THEN
        ((SUM(oi.subtotal) - SUM(oi.quantity * oi.cost_price_at_order_time)) / SUM(oi.subtotal)) * 100
      ELSE 0
    END AS profit_margin
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN product_variants pv ON pv.id = oi.variant_id
  JOIN products p ON p.id = pv.product_id
  WHERE o.status = 'delivered'
    AND o.created_at >= date_from
    AND o.created_at <= date_to
  GROUP BY oi.variant_id, p.name, pv.sku
  ORDER BY total_profit DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

###### Lịch sử giá vốn

```typescript
// app/models/report.server.ts

interface CostPriceChange {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changedAt: string;
}

export async function getCostPriceHistory(
  supabase: SupabaseClient,
  variantId?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: CostPriceChange[]; total: number }> {
  let query = supabase
    .from('cost_price_history')
    .select(`
      id,
      variant_id,
      old_price,
      new_price,
      changed_at,
      variant:product_variants!variant_id (
        sku,
        product:products (name)
      )
    `, { count: 'exact' })
    .order('changed_at', { ascending: false });

  if (variantId) {
    query = query.eq('variant_id', variantId);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const history = (data || []).map(item => ({
    id: item.id,
    variantId: item.variant_id,
    productName: item.variant?.product?.name || '',
    sku: item.variant?.sku || '',
    oldPrice: item.old_price,
    newPrice: item.new_price,
    changePercent: item.old_price > 0 
      ? ((item.new_price - item.old_price) / item.old_price) * 100 
      : 0,
    changedAt: item.changed_at
  }));

  return {
    data: history,
    total: count || 0
  };
}
```

###### Chi tiết lợi nhuận đơn hàng

```typescript
// app/models/report.server.ts

interface OrderProfitDetail {
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    revenue: number;
    profit: number;
  }>;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export async function getOrderProfitDetail(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderProfitDetail> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      subtotal,
      total_cost,
      profit,
      created_at,
      customer:profiles!customer_id (
        full_name
      ),
      items:order_items (
        quantity,
        unit_price,
        cost_price_at_order_time,
        subtotal,
        variant:product_variants (
          sku,
          product:products (name)
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;

  const items = (order.items || []).map(item => ({
    productName: item.variant?.product?.name || '',
    sku: item.variant?.sku || '',
    quantity: item.quantity,
    unitPrice: item.unit_price,
    costPrice: item.cost_price_at_order_time,
    revenue: item.subtotal,
    profit: item.subtotal - (item.quantity * item.cost_price_at_order_time)
  }));

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    customerName: order.customer?.full_name || '',
    createdAt: order.created_at,
    items,
    totalRevenue: order.subtotal,
    totalCost: order.total_cost,
    totalProfit: order.profit,
    profitMargin: order.subtotal > 0 
      ? (order.profit / order.subtotal) * 100 
      : 0
  };
}
```

###### Xuất báo cáo Excel

```typescript
// app/models/report.server.ts
// Note: Sử dụng xlsx skill để tạo file Excel

export async function exportReportToExcel(
  supabase: SupabaseClient,
  dateFrom: Date,
  dateTo: Date
): Promise<Buffer> {
  // Get all report data
  const summary = await getReportSummary(supabase, dateFrom, dateTo);
  const dailyData = await getDailyRevenue(supabase, dateFrom, dateTo);
  const topProducts = await getTopProductsByProfit(supabase, dateFrom, dateTo, 20);

  // Create Excel workbook using xlsx skill
  // (Implementation follows xlsx skill guidelines)
  
  // ... Excel generation code ...

  return excelBuffer;
}
```

---

#### 7. Validation Rules

##### 7.1 Giá vốn

| Trường | Rule | Message |
|--------|------|---------|
| cost_price | >= 0 | Giá vốn không được âm |
| cost_price | <= selling_price | Giá vốn không nên cao hơn giá bán |

##### 7.2 Khoảng thời gian báo cáo

| Rule | Message |
|------|---------|
| dateFrom <= dateTo | Ngày bắt đầu phải trước ngày kết thúc |
| Khoảng thời gian <= 1 năm | Khoảng thời gian tối đa là 1 năm |

---

#### 8. Test Cases

##### TC-06-01: Cập nhật giá vốn - lưu lịch sử
**Precondition:** Có sản phẩm với cost_price = 100,000đ  
**Steps:**
1. Sửa cost_price thành 120,000đ
2. Lưu thay đổi

**Expected:**
- cost_price được cập nhật
- Bản ghi mới trong cost_price_history: old=100,000, new=120,000

##### TC-06-02: Đơn hàng giữ giá vốn cũ
**Precondition:** 
- Sản phẩm A có cost_price = 100,000đ
- Đã có đơn hàng cũ mua A với cost_price_at_order_time = 80,000đ

**Steps:**
1. Xem chi tiết lợi nhuận đơn hàng cũ

**Expected:** Giá vốn hiển thị là 80,000đ (không phải 100,000đ hiện tại)

##### TC-06-03: Tính toán lợi nhuận đúng
**Precondition:** Đơn hàng với:
- Item 1: qty=2, price=450,000, cost=300,000
- Item 2: qty=1, price=300,000, cost=180,000

**Expected:**
- total_revenue = 1,200,000đ
- total_cost = 780,000đ
- profit = 420,000đ
- margin = 35%

##### TC-06-04: Báo cáo theo ngày
**Precondition:** Có dữ liệu đơn hàng trong tháng 12  
**Steps:**
1. Chọn thời gian: 01/12 - 31/12
2. Xem báo cáo

**Expected:**
- Biểu đồ hiển thị đúng doanh thu từng ngày
- Tổng khớp với tổng tất cả đơn delivered

##### TC-06-05: Top sản phẩm lợi nhuận
**Steps:**
1. Xem báo cáo Top sản phẩm

**Expected:**
- Danh sách sắp xếp theo lợi nhuận giảm dần
- Hiển thị số lượng, doanh thu, lợi nhuận chính xác

##### TC-06-06: Xuất báo cáo Excel
**Steps:**
1. Chọn thời gian báo cáo
2. Click "Xuất Excel"

**Expected:**
- File Excel được tải về
- Dữ liệu khớp với hiển thị trên web

---

#### 9. Business Rules

##### 9.1 Giá vốn (Cost Price)
- Lưu ở cấp variant (không phải product)
- Khi thay đổi, tự động log vào cost_price_history
- Đơn hàng cũ không bị ảnh hưởng khi giá vốn thay đổi

##### 9.2 Tính lợi nhuận
- Sử dụng cost_price_at_order_time từ order_items
- Chỉ tính cho đơn hàng delivered
- Đơn hủy không tính vào báo cáo

##### 9.3 Báo cáo
- Cache trong daily_reports để tối ưu performance
- Trigger tự động cập nhật khi đơn hàng thay đổi
- Có thể xuất Excel để lưu trữ

##### 9.4 Quyền truy cập
- Chỉ Admin được xem thông tin giá vốn và lợi nhuận
- Customer không thấy các thông tin này

##### 9.5 Đơn vị tiền tệ
- Tất cả giá trị tiền tệ sử dụng VND
- Không có chuyển đổi ngoại tệ
- Định dạng hiển thị: 1,000,000đ
