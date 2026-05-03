---
id: SPEC-017
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Dashboard & Reports

## Related Epics

- [[Epic-10-Dashboard]]

## Module Notes

### Module 10: Dashboard & Báo Cáo (Reporting)

**Mục tiêu**: Cung cấp cái nhìn tổng quan về tình hình kinh doanh.

---

#### 1. Tính Năng (Features)

- **10.1 Sales Overview**: Doanh thu hôm nay, tuần này, tháng này.
- **10.2 Order Pipeline**: Số lượng đơn Pending, Processing, Shipping.
- **10.3 Inventory Alerts**: List sản phẩm sắp hết hàng.
- **10.4 Financial Reports**: Biểu đồ cột/đường về doanh thu/lợi nhuận.

---

#### 2. Thiết Kế (Design)

##### UI Components

- **StatCard**: Hiển thị số liệu đơn (Total Orders, Revenue).
- **RevenueChart**: Recharts/Chart.js visualization.
- **TopProducts**: Table top selling.

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Data Aggregation

- Sử dụng Database Views hoặc Materialized Views (nếu data lớn) để query nhanh report.
- Hoặc query trực tiếp với Date Range filters.

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`daily_reports`**: Aggregate data mỗi cuối ngày (Job scheduler) để cache report lịch sử cho nhanh.

## Feature Details

### F07: Báo cáo & Dashboard

#### 1. Tổng quan

Module Dashboard và Báo cáo cung cấp cái nhìn tổng quan về hoạt động kinh doanh, giúp Admin nhanh chóng nắm bắt tình hình và đưa ra quyết định.

##### 1.1 Phạm vi

- Dashboard tổng quan cho Admin
- Thống kê đơn hàng theo thời gian
- Danh sách sản phẩm bán chạy
- Cảnh báo tồn kho thấp
- Danh sách khách hàng thường xuyên
- Hoạt động gần đây

##### 1.2 Actors

| Actor | Mô tả                    |
| ----- | ------------------------ |
| Admin | Xem dashboard và báo cáo |

---

#### 2. User Stories

##### US-07-01: Xem Dashboard tổng quan

**Là** Admin  
**Tôi muốn** xem dashboard khi đăng nhập  
**Để** nhanh chóng nắm bắt tình hình

**Acceptance Criteria:**

- Hiển thị các chỉ số chính: doanh thu, đơn hàng, khách hàng mới
- So sánh với kỳ trước (hôm qua, tuần trước, tháng trước)
- Load nhanh, dưới 2 giây

##### US-07-02: Xem thống kê đơn hàng

**Là** Admin  
**Tôi muốn** xem thống kê đơn hàng theo trạng thái  
**Để** biết có bao nhiêu đơn cần xử lý

**Acceptance Criteria:**

- Số đơn theo từng trạng thái
- Đơn hàng mới chờ xử lý nổi bật
- Quick link đến danh sách đơn tương ứng

##### US-07-03: Xem sản phẩm bán chạy

**Là** Admin  
**Tôi muốn** biết sản phẩm nào bán chạy nhất  
**Để** lên kế hoạch nhập hàng

**Acceptance Criteria:**

- Top 5-10 sản phẩm bán chạy
- Hiển thị số lượng bán, doanh thu
- Lọc theo thời gian (7 ngày, 30 ngày)

##### US-07-04: Nhận cảnh báo tồn kho thấp

**Là** Admin  
**Tôi muốn** được cảnh báo khi sản phẩm sắp hết hàng  
**Để** kịp thời nhập thêm

**Acceptance Criteria:**

- Danh sách sản phẩm có tồn kho < ngưỡng
- Ngưỡng mặc định: 10 sản phẩm
- Badge cảnh báo trên menu

##### US-07-05: Xem khách hàng thường xuyên

**Là** Admin  
**Tôi muốn** biết khách hàng mua nhiều nhất  
**Để** có chính sách chăm sóc phù hợp

**Acceptance Criteria:**

- Top 5-10 khách hàng theo tổng chi tiêu
- Hiển thị số đơn, tổng tiền, đơn gần nhất
- Lọc theo thời gian

##### US-07-06: Xem hoạt động gần đây

**Là** Admin  
**Tôi muốn** xem các hoạt động gần đây trong hệ thống  
**Để** theo dõi những gì đang xảy ra

**Acceptance Criteria:**

- Đơn hàng mới
- Tin nhắn mới từ khách
- Sản phẩm được xem nhiều

---

#### 3. Thiết kế UI

##### 3.1 Admin Dashboard - Tổng quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TỔNG QUAN                                          Hôm nay: 30/12/2025 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────┐│
│ │  💰 DOANH THU   │ │  📦 ĐƠN HÀNG    │ │  👥 KHÁCH MỚI  │ │ 💬 CHAT ││
│ │                 │ │                 │ │                 │ │         ││
│ │  15,500,000đ    │ │      12         │ │       3         │ │   5     ││
│ │  ↑ 12%         │ │  ↑ 2 vs hôm qua │ │  ↓ 1 vs hôm qua │ │ chưa đọc││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────┘│
│                                                                         │
│ ┌──────────────────────────────────────┐ ┌────────────────────────────┐│
│ │ THỐNG KÊ ĐƠN HÀNG                   │ │ ⚠️ CẢNH BÁO TỒN KHO        ││
│ ├──────────────────────────────────────┤ ├────────────────────────────┤│
│ │                                      │ │                            ││
│ │  🟡 Chờ xác nhận:     5   [Xem →]   │ │  Son MAC Ruby     còn 3   ││
│ │  🔵 Đang xử lý:       3   [Xem →]   │ │  Kem XYZ Night    còn 5   ││
│ │  🟢 Hoàn thành:       4             │ │  Serum ABC Vit C  còn 8   ││
│ │  🔴 Đã hủy:           0             │ │                            ││
│ │                                      │ │  [Xem tất cả →]           ││
│ └──────────────────────────────────────┘ └────────────────────────────┘│
│                                                                         │
│ ┌──────────────────────────────────────┐ ┌────────────────────────────┐│
│ │ 🏆 SẢN PHẨM BÁN CHẠY (7 ngày)       │ │ 👤 KHÁCH HÀNG THƯỜNG XUYÊN││
│ ├──────────────────────────────────────┤ ├────────────────────────────┤│
│ │                                      │ │                            ││
│ │  1. Son MAC Ruby Woo      45 cái    │ │  1. KH001 - Hương 5.2tr   ││
│ │  2. Kem dưỡng XYZ Night   32 cái    │ │  2. KH003 - Lan   3.8tr   ││
│ │  3. Serum ABC Vitamin C   28 cái    │ │  3. KH007 - Minh  2.5tr   ││
│ │  4. Toner DEF Hyaluronic  25 cái    │ │  4. KH002 - Mai   1.9tr   ││
│ │  5. Sữa rửa mặt GHI       40 cái    │ │  5. KH005 - Thảo  1.2tr   ││
│ │                                      │ │                            ││
│ │  [Xem chi tiết →]                   │ │  [Xem tất cả →]           ││
│ └──────────────────────────────────────┘ └────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 📋 HOẠT ĐỘNG GẦN ĐÂY                                                ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │                                                                     ││
│ │  🛒 14:35 - Đơn hàng mới #ORD-20251230-012 từ KH003 (450,000đ)     ││
│ │  💬 14:30 - Tin nhắn mới từ KH007                                   ││
│ │  ✅ 14:15 - Đơn #ORD-20251230-008 đã hoàn thành                     ││
│ │  🛒 13:50 - Đơn hàng mới #ORD-20251230-011 từ KH001 (1,200,000đ)   ││
│ │  💬 13:45 - Tin nhắn mới từ KH003                                   ││
│ │                                                                     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 3.2 Chi tiết sản phẩm bán chạy

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SẢN PHẨM BÁN CHẠY                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Thời gian: [7 ngày ▼]  [30 ngày]  [90 ngày]  [Tùy chọn...]            │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #  │ Sản phẩm              │ SKU     │ SL bán │ Doanh thu   │ Tồn  │ │
│ ├────┼───────────────────────┼─────────┼────────┼─────────────┼──────┤ │
│ │ 1  │ Son MAC Ruby Woo      │ MAC-001 │ 45     │ 20,250,000đ │ 3 ⚠️ │ │
│ │ 2  │ Kem dưỡng XYZ Night   │ XYZ-01  │ 32     │ 9,600,000đ  │ 5 ⚠️ │ │
│ │ 3  │ Serum ABC Vitamin C   │ ABC-01  │ 28     │ 8,400,000đ  │ 8 ⚠️ │ │
│ │ 4  │ Toner DEF Hyaluronic  │ DEF-01  │ 25     │ 5,000,000đ  │ 25   │ │
│ │ 5  │ Sữa rửa mặt GHI       │ GHI-01  │ 40     │ 4,000,000đ  │ 50   │ │
│ │ 6  │ Mascara JKL           │ JKL-01  │ 22     │ 3,300,000đ  │ 30   │ │
│ │ 7  │ Phấn phủ MNO          │ MNO-01  │ 20     │ 3,000,000đ  │ 45   │ │
│ │ 8  │ Son dưỡng PQR         │ PQR-01  │ 35     │ 2,800,000đ  │ 60   │ │
│ │ 9  │ Nước hoa hồng STU     │ STU-01  │ 18     │ 2,700,000đ  │ 20   │ │
│ │ 10 │ Kem nền VWX           │ VWX-01  │ 15     │ 2,250,000đ  │ 40   │ │
│ └────┴───────────────────────┴─────────┴────────┴─────────────┴──────┘ │
│                                                                         │
│ ⚠️ = Tồn kho dưới ngưỡng cảnh báo (10)                                 │
│                                                                         │
│                                       [◄ Trước] Trang 1/2 [Tiếp ►]     │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 3.3 Cảnh báo tồn kho

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ CẢNH BÁO TỒN KHO THẤP                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Ngưỡng cảnh báo: [10 ▼] sản phẩm          [Cập nhật]                   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Sản phẩm              │ SKU     │ Tồn kho │ Ngưỡng │ Trạng thái     │ │
│ ├───────────────────────┼─────────┼─────────┼────────┼────────────────┤ │
│ │ Son MAC Ruby Woo      │ MAC-001 │ 3       │ 10     │ 🔴 Sắp hết    │ │
│ │ Kem dưỡng XYZ Night   │ XYZ-01  │ 5       │ 10     │ 🔴 Sắp hết    │ │
│ │ Serum ABC Vitamin C   │ ABC-01  │ 8       │ 10     │ 🟡 Thấp       │ │
│ │ Toner DEF Hyaluronic  │ DEF-01  │ 0       │ 10     │ 🔴 Hết hàng   │ │
│ └───────────────────────┴─────────┴─────────┴────────┴────────────────┘ │
│                                                                         │
│ Tổng: 4 sản phẩm cần chú ý                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 3.4 Khách hàng thường xuyên

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KHÁCH HÀNG THƯỜNG XUYÊN                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Thời gian: [Tất cả ▼]  [30 ngày]  [90 ngày]  [Năm nay]                │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #  │ Khách hàng            │ Loại   │ Số đơn │ Tổng chi tiêu│ Gần nhất│
│ ├────┼───────────────────────┼────────┼────────┼──────────────┼─────────┤ │
│ │ 1  │ KH001 - Nguyễn Hương  │ Sỉ     │ 25     │ 52,500,000đ  │ Hôm nay │ │
│ │ 2  │ KH003 - Nguyễn Lan    │ Lẻ     │ 18     │ 38,200,000đ  │ Hôm nay │ │
│ │ 3  │ KH007 - Trần Minh     │ Sỉ     │ 15     │ 25,800,000đ  │ Hôm qua │ │
│ │ 4  │ KH002 - Lê Mai        │ Lẻ     │ 12     │ 19,600,000đ  │ 25/12   │ │
│ │ 5  │ KH005 - Vũ Thảo       │ Lẻ     │ 10     │ 12,500,000đ  │ 28/12   │ │
│ └────┴───────────────────────┴────────┴────────┴──────────────┴─────────┘ │
│                                                                         │
│ Click vào khách hàng để xem chi tiết                                   │
│                                                                         │
│                                       [◄ Trước] Trang 1/3 [Tiếp ►]     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 4. Triển khai kỹ thuật

##### 4.1 API Routes

```
app/routes/
├── admin._index.tsx              # Dashboard chính
├── admin.reports.top-products.tsx   # Sản phẩm bán chạy
├── admin.reports.low-stock.tsx      # Cảnh báo tồn kho
├── admin.reports.top-customers.tsx  # Khách hàng thường xuyên
└── api.dashboard.stats.tsx          # API stats cho real-time update
```

##### 4.2 Code Implementation

###### Thống kê Dashboard

```typescript
// app/models/dashboard.server.ts

interface DashboardStats {
  revenue: {
    today: number;
    changePercent: number;
  };
  orders: {
    today: number;
    change: number;
  };
  newCustomers: {
    today: number;
    change: number;
  };
  unreadChats: number;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
): Promise<DashboardStats> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
  const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

  // Today's revenue
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("status", "delivered")
    .gte("created_at", todayStart.toISOString());

  const todayRevenue =
    todayOrders?.reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;

  // Yesterday's revenue for comparison
  const { data: yesterdayOrders } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("status", "delivered")
    .gte("created_at", yesterdayStart.toISOString())
    .lte("created_at", yesterdayEnd.toISOString());

  const yesterdayRevenue =
    yesterdayOrders?.reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;

  const revenueChangePercent =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

  // Today's order count
  const { count: todayOrderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  const { count: yesterdayOrderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStart.toISOString())
    .lte("created_at", yesterdayEnd.toISOString());

  // New customers today
  const { count: newCustomersToday } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer")
    .gte("created_at", todayStart.toISOString());

  const { count: newCustomersYesterday } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer")
    .gte("created_at", yesterdayStart.toISOString())
    .lte("created_at", yesterdayEnd.toISOString());

  // Unread chat messages
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("id, customer_id");

  let unreadCount = 0;
  for (const room of rooms || []) {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("sender_id", room.customer_id)
      .eq("is_read", false);
    unreadCount += count || 0;
  }

  return {
    revenue: {
      today: todayRevenue,
      changePercent: revenueChangePercent,
    },
    orders: {
      today: todayOrderCount || 0,
      change: (todayOrderCount || 0) - (yesterdayOrderCount || 0),
    },
    newCustomers: {
      today: newCustomersToday || 0,
      change: (newCustomersToday || 0) - (newCustomersYesterday || 0),
    },
    unreadChats: unreadCount,
  };
}
```

###### Thống kê đơn hàng theo trạng thái

```typescript
// app/models/dashboard.server.ts

interface OrdersByStatus {
  pending: number;
  paid: number;
  preparing: number;
  shipping: number;
  delivered: number;
  cancelled: number;
}

export async function getOrdersByStatus(
  supabase: SupabaseClient,
): Promise<OrdersByStatus> {
  const statuses = [
    "pending",
    "paid",
    "preparing",
    "shipping",
    "delivered",
    "cancelled",
  ];

  const counts: Partial<OrdersByStatus> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    counts[status as keyof OrdersByStatus] = count || 0;
  }

  return counts as OrdersByStatus;
}
```

###### Sản phẩm bán chạy

```typescript
// app/models/dashboard.server.ts

interface TopProduct {
  variantId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  stockQuantity: number;
  stockType: string;
}

export async function getTopSellingProducts(
  supabase: SupabaseClient,
  days: number = 7,
  limit: number = 10,
): Promise<TopProduct[]> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase.rpc("get_top_selling_products", {
    date_from: dateFrom.toISOString(),
    result_limit: limit,
  });

  if (error) throw error;

  return data || [];
}
```

###### Stored Procedure cho Top Products

```sql
CREATE OR REPLACE FUNCTION get_top_selling_products(
  date_from TIMESTAMPTZ,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  variant_id UUID,
  product_name TEXT,
  sku VARCHAR,
  quantity_sold BIGINT,
  revenue DECIMAL,
  stock_quantity INT,
  stock_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id AS variant_id,
    p.name::TEXT AS product_name,
    pv.sku,
    COALESCE(SUM(oi.quantity), 0)::BIGINT AS quantity_sold,
    COALESCE(SUM(oi.subtotal), 0) AS revenue,
    pv.stock_quantity,
    pv.stock_type
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  LEFT JOIN order_items oi ON oi.variant_id = pv.id
  LEFT JOIN orders o ON o.id = oi.order_id
    AND o.status = 'delivered'
    AND o.created_at >= date_from
  WHERE pv.is_active = true
  GROUP BY pv.id, p.name, pv.sku, pv.stock_quantity, pv.stock_type
  ORDER BY quantity_sold DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

###### Cảnh báo tồn kho thấp

```typescript
// app/models/dashboard.server.ts

interface LowStockProduct {
  variantId: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  threshold: number;
  status: "out_of_stock" | "critical" | "low";
}

export async function getLowStockProducts(
  supabase: SupabaseClient,
  threshold: number = 10,
): Promise<LowStockProduct[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `
      id,
      sku,
      stock_quantity,
      stock_type,
      product:products (name)
    `,
    )
    .eq("stock_type", "in_stock")
    .eq("is_active", true)
    .lte("stock_quantity", threshold)
    .order("stock_quantity", { ascending: true });

  if (error) throw error;

  return (data || []).map((item) => ({
    variantId: item.id,
    productName: item.product?.name || "",
    sku: item.sku,
    stockQuantity: item.stock_quantity,
    threshold,
    status:
      item.stock_quantity === 0
        ? "out_of_stock"
        : item.stock_quantity <= threshold / 2
          ? "critical"
          : "low",
  }));
}
```

###### Khách hàng thường xuyên

```typescript
// app/models/dashboard.server.ts

interface TopCustomer {
  customerId: string;
  customerCode: string;
  fullName: string;
  customerType: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export async function getTopCustomers(
  supabase: SupabaseClient,
  days?: number,
  limit: number = 10,
): Promise<TopCustomer[]> {
  let dateFilter = "";
  if (days) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    dateFilter = dateFrom.toISOString();
  }

  const { data, error } = await supabase.rpc("get_top_customers", {
    date_from: dateFilter || null,
    result_limit: limit,
  });

  if (error) throw error;

  return data || [];
}
```

###### Stored Procedure cho Top Customers

```sql
CREATE OR REPLACE FUNCTION get_top_customers(
  date_from TIMESTAMPTZ DEFAULT NULL,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  customer_id UUID,
  customer_code VARCHAR,
  full_name VARCHAR,
  customer_type VARCHAR,
  total_orders BIGINT,
  total_spent DECIMAL,
  last_order_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS customer_id,
    p.customer_code,
    p.full_name,
    p.customer_type,
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.subtotal), 0) AS total_spent,
    MAX(o.created_at) AS last_order_date
  FROM profiles p
  LEFT JOIN orders o ON o.customer_id = p.id
    AND o.status = 'delivered'
    AND (date_from IS NULL OR o.created_at >= date_from)
  WHERE p.role = 'customer'
  GROUP BY p.id, p.customer_code, p.full_name, p.customer_type
  HAVING COUNT(o.id) > 0
  ORDER BY total_spent DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

###### Hoạt động gần đây

```typescript
// app/models/dashboard.server.ts

interface RecentActivity {
  type: "order" | "chat" | "order_delivered";
  timestamp: string;
  description: string;
  link?: string;
}

export async function getRecentActivities(
  supabase: SupabaseClient,
  limit: number = 10,
): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      subtotal,
      created_at,
      customer:profiles!customer_id (customer_code)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const order of recentOrders || []) {
    activities.push({
      type: "order",
      timestamp: order.created_at,
      description: `Đơn hàng mới #${order.order_number} từ ${order.customer?.customer_code} (${formatCurrency(order.subtotal)})`,
      link: `/admin/orders/${order.id}`,
    });
  }

  // Delivered orders
  const { data: deliveredOrders } = await supabase
    .from("orders")
    .select("id, order_number, updated_at")
    .eq("status", "delivered")
    .order("updated_at", { ascending: false })
    .limit(5);

  for (const order of deliveredOrders || []) {
    activities.push({
      type: "order_delivered",
      timestamp: order.updated_at,
      description: `Đơn #${order.order_number} đã giao thành công`,
      link: `/admin/orders/${order.id}`,
    });
  }

  // Recent chat messages
  const { data: recentMessages } = await supabase
    .from("chat_messages")
    .select(
      `
      created_at,
      room:chat_rooms!room_id (
        id,
        customer:profiles!customer_id (customer_code)
      )
    `,
    )
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const msg of recentMessages || []) {
    activities.push({
      type: "chat",
      timestamp: msg.created_at,
      description: `Tin nhắn mới từ ${msg.room?.customer?.customer_code}`,
      link: `/admin/chat/${msg.room?.id}`,
    });
  }

  // Sort by timestamp and limit
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}
```

##### 4.3 Dashboard Component

```tsx
// app/admin/(dashboard)/page.tsx

import {
  getDashboardStats,
  getOrdersByStatus,
  getTopSellingProducts,
  getLowStockProducts,
  getTopCustomers,
  getRecentActivities,
} from "@/services/dashboard.server";

export default async function AdminDashboard() {
  const [
    stats,
    ordersByStatus,
    topProducts,
    lowStockProducts,
    topCustomers,
    recentActivities,
  ] = await Promise.all([
    getDashboardStats(),
    getOrdersByStatus(),
    getTopSellingProducts(7, 5),
    getLowStockProducts(),
    getTopCustomers(5),
    getRecentActivities(10),
  ]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu"
          value={formatCurrency(stats.revenue.today)}
          change={`${stats.revenue.changePercent > 0 ? "↑" : "↓"} ${Math.abs(stats.revenue.changePercent).toFixed(0)}%`}
          icon="💰"
        />
        <StatCard
          title="Đơn hàng"
          value={stats.orders.today}
          change={`${stats.orders.change >= 0 ? "↑" : "↓"} ${Math.abs(stats.orders.change)} vs hôm qua`}
          icon="📦"
        />
        <StatCard
          title="Khách mới"
          value={stats.newCustomers.today}
          change={`${stats.newCustomers.change >= 0 ? "↑" : "↓"} ${Math.abs(stats.newCustomers.change)} vs hôm qua`}
          icon="👥"
        />
        <StatCard
          title="Chat"
          value={stats.unreadChats}
          subtitle="chưa đọc"
          icon="💬"
        />
      </div>

      {/* Order Status & Low Stock */}
      <div className="grid grid-cols-2 gap-4">
        <OrderStatusWidget data={ordersByStatus} />
        <LowStockWidget products={lowStockProducts} />
      </div>

      {/* Top Products & Top Customers */}
      <div className="grid grid-cols-2 gap-4">
        <TopProductsWidget products={topProducts} />
        <TopCustomersWidget customers={topCustomers} />
      </div>

      {/* Recent Activities */}
      <RecentActivitiesWidget activities={recentActivities} />
    </div>
  );
}
```

---

#### 5. Caching Strategy

##### 5.1 Dashboard Stats Caching

```typescript
// Sử dụng daily_reports table cho caching
// Update qua trigger khi orders thay đổi

// Cho stats real-time, có thể dùng Supabase Realtime
// để subscribe changes và update UI

// Client-side caching với SWR hoặc React Query
// Revalidate mỗi 5 phút cho dashboard
```

##### 5.2 Database Index Optimization

```sql
-- Indexes for dashboard queries
CREATE INDEX idx_orders_status_created
  ON orders(status, created_at);

CREATE INDEX idx_orders_delivered_date
  ON orders(created_at)
  WHERE status = 'delivered';

CREATE INDEX idx_profiles_role_created
  ON profiles(role, created_at);

CREATE INDEX idx_product_variants_stock_active
  ON product_variants(stock_quantity, is_active)
  WHERE stock_type = 'in_stock';
```

---

#### 6. Test Cases

##### TC-07-01: Dashboard load nhanh

**Steps:**

1. Admin đăng nhập
2. Vào trang Dashboard

**Expected:**

- Dashboard hiển thị trong < 2 giây
- Tất cả widgets đều có dữ liệu

##### TC-07-02: So sánh với hôm qua

**Precondition:** Có dữ liệu hôm nay và hôm qua  
**Steps:**

1. Xem Dashboard

**Expected:**

- Hiển thị % thay đổi doanh thu
- Hiển thị số đơn hàng tăng/giảm

##### TC-07-03: Top sản phẩm đúng thời gian

**Steps:**

1. Chọn "7 ngày"
2. Xem danh sách top sản phẩm

**Expected:**

- Chỉ tính đơn hoàn thành trong 7 ngày
- Sắp xếp đúng theo số lượng bán

##### TC-07-04: Cảnh báo tồn kho

**Precondition:** Có sản phẩm với stock < 10  
**Steps:**

1. Xem widget cảnh báo tồn kho

**Expected:**

- Hiển thị sản phẩm có tồn kho thấp
- Badge cảnh báo trên sidebar

##### TC-07-05: Khách hàng không có đơn

**Precondition:** Có khách hàng chưa có đơn nào  
**Steps:**

1. Xem danh sách khách hàng thường xuyên

**Expected:** Khách hàng chưa có đơn không xuất hiện trong danh sách

##### TC-07-06: Hoạt động gần đây cập nhật

**Steps:**

1. Xem Dashboard
2. Tạo đơn hàng mới từ tab khác

**Expected:** Đơn hàng mới xuất hiện trong hoạt động gần đây (sau refresh)

---

#### 7. Business Rules

##### 7.1 Chỉ số Dashboard

- Doanh thu: Chỉ tính đơn hàng delivered
- Đơn hàng: Tính tất cả đơn trong ngày
- Khách mới: Dựa trên ngày tạo tài khoản
- So sánh: So với cùng kỳ hôm qua

##### 7.2 Sản phẩm bán chạy

- Chỉ tính đơn hàng delivered
- Sắp xếp theo số lượng bán, không phải doanh thu
- Hiển thị cảnh báo nếu tồn kho thấp

##### 7.3 Cảnh báo tồn kho

- Ngưỡng mặc định: 10 sản phẩm
- Chỉ áp dụng cho sản phẩm in_stock
- Không áp dụng cho pre_order

##### 7.4 Khách hàng thường xuyên

- Sắp xếp theo tổng chi tiêu
- Chỉ tính đơn delivered
- Có thể lọc theo thời gian

##### 7.5 Real-time

- Dashboard không bắt buộc real-time
- Có thể cache và refresh định kỳ
- Badge tin nhắn nên real-time

---

#### 8. Performance Optimization

##### 8.1 Caching Strategy

- Sử dụng daily_reports table cho báo cáo ngày
- Cache kết quả dashboard trong 5 phút
- Invalidate cache khi có đơn hàng mới

##### 8.2 Database Optimization

- Tạo indexes cho các query phổ biến
- Sử dụng materialized views cho báo cáo nặng
- Limit kết quả hợp lý (top 5, top 10)

##### 8.3 Frontend Optimization

- **PageSkeleton loading states**: All 27 dashboard pages display PageSkeleton on initial load, eliminating blank screens during data fetch
- **Global header search**: 300ms debounced search with 3 parallel queries (products/orders/customers), limit 4 per type, grouped dropdown with keyboard navigation (arrow keys + Enter) and ARIA labels
- Lazy loading cho widgets không critical
- Optimistic UI updates
