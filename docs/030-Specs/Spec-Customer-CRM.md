---
id: SPEC-013
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Customer CRM

## Related Epics

- [[Epic-05-CustomerManagement]]


## Module Notes

### Module 5: Quản Lý Khách Hàng (CRM)

**Mục tiêu**: Lưu trữ thông tin khách hàng, lịch sử mua hàng để chăm sóc và tạo đơn nhanh.

---

#### 1. Tính Năng (Features)

- **5.1 CRUD Customer**: Thêm/Sửa/Xóa thông tin khách.
- **5.2 Classification**: Phân loại Khách sỉ (Wholesale) / Khách lẻ (Retail).
- **5.3 History**: Xem lịch sử đơn hàng, tổng chi tiêu.

---

#### 2. Thiết Kế (Design)

##### UI Components

- **CustomerList**: Table với cột Phone, Name, Class, Total Spend.
- **CustomerDetail**:
  - Thông tin cá nhân.
  - Tab "Lịch sử đơn hàng": List Order history.
  - Tab "Công nợ": Nếu có (Module Finance).

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Customer Creation

- Khi tạo đơn mới cho khách mới -> Auto create Customer Profile từ thông tin shipping.
- Hoặc Tạo chủ động từ Admin.

##### 3.2 Code Generation

- Auto-gen Customer Code: `KH-0001`, `KH-0002`... dùng sequence hoặc trigger DB.

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`profiles` (Customer Role)**:
  - `user_id`: NULL.
  - `customer_code`: Unique.
  - `customer_type`: `wholesale`/`retail`.
  - `phone`, `address`: Shipping Default.


## Feature Details

### F03: Quản lý Khách hàng

**Module:** Customer Management  
**Phiên bản:** 1.0 | **Ngày:** 30/12/2024

---

#### 1. Tổng quan

##### 1.1 Mục đích

Module Quản lý Khách hàng cho phép Admin tạo, quản lý và theo dõi thông tin khách hàng trong hệ thống closed-system, nơi chỉ Admin có quyền tạo tài khoản.

##### 1.2 Đặc điểm chính

- Closed system: Admin tạo tài khoản, khách không tự đăng ký
- Mã khách hàng tự động sinh (KH001, KH002...)
- Phân loại: Khách sỉ (wholesale) và Khách lẻ (retail)
- Theo dõi lịch sử mua hàng
- Không có tính năng đăng nhập cho khách hàng (chỉ lưu hồ sơ)

---

#### 2. User Stories

| ID | User Story | Priority |
|----|------------|----------|
| CUST-01 | Là Admin, tôi muốn xem danh sách khách hàng với tìm kiếm và lọc | Must |
| CUST-02 | Là Admin, tôi muốn tạo tài khoản khách hàng mới | Must |
| CUST-03 | Là Admin, tôi muốn sửa thông tin khách hàng | Must |
| CUST-04 | Là Admin, tôi muốn phân loại khách sỉ/lẻ | Must |
| CUST-05 | Là Admin, tôi muốn xem lịch sử mua hàng của khách | Must |
| CUST-06 | Là Admin, tôi muốn vô hiệu hóa tài khoản khách | Should |
| CUST-08 | Là Admin, tôi muốn xem thống kê tổng quan về khách | Could |

---

#### 3. Quy trình nghiệp vụ

##### 3.1 Quy trình Tạo Khách hàng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CREATE CUSTOMER FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Admin mở    │────►│  Nhập thông  │────►│  Chọn loại   │────►│  Hệ thống    │
  │  form tạo KH │     │  tin KH      │     │  sỉ/lẻ       │     │  sinh mã KH  │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                        │
                    ┌───────────────────────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Hệ thống tạo       │
         │  hồ sơ khách hàng   │
         └─────────────────────┘

Thông tin cần nhập:
- Họ tên (bắt buộc)
- Số điện thoại
- Địa chỉ
- Loại khách hàng: Sỉ / Lẻ

Hệ thống tự động:
- Sinh mã KH: KH001, KH002...
- Tạo chat room riêng
```

##### 3.2 Customer Code Generation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER CODE GENERATION                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Format: KH + 3 chữ số (padding với 0)

Ví dụ:
- Khách đầu tiên: KH001
- Khách thứ 10: KH010
- Khách thứ 100: KH100
- Khách thứ 1000: KH1000 (mở rộng khi cần)

Query để lấy mã tiếp theo:
SELECT MAX(CAST(SUBSTRING(customer_code, 3) AS INTEGER)) + 1
FROM profiles
WHERE customer_code LIKE 'KH%'
```

---

#### 4. Thiết kế UI

##### 4.1 Danh sách Khách hàng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏪 Admin Portal                                    👤 Admin ▼              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Dashboard | Sản phẩm | Khách hàng | Đơn hàng | Chat | Báo cáo              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Quản lý Khách hàng                                  [+ Thêm khách hàng]   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Tìm kiếm (tên, SĐT, mã KH)...    │ Loại ▼    │ Trạng thái ▼     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Mã KH   │ Họ tên          │ SĐT          │ Loại │ Đơn │ T.Tiền│ TT │   │
│  ├─────────┼─────────────────┼──────────────┼──────┼─────┼───────┼────┤   │
│  │ KH001   │ Nguyễn Văn A    │ 0901234567   │ 🏪Sỉ │ 45  │ 12.5M │ ✅ │   │
│  │ KH002   │ Trần Thị B      │ 0912345678   │ 👤Lẻ │ 12  │ 2.8M  │ ✅ │   │
│  │ KH003   │ Lê Văn C        │ 0923456789   │ 🏪Sỉ │ 28  │ 8.2M  │ ✅ │   │
│  │ KH004   │ Phạm Thị D      │ 0934567890   │ 👤Lẻ │ 3   │ 450K  │ ❌ │   │
│  │ ...     │ ...             │ ...          │ ...  │ ... │ ...   │ ...│   │
│  └─────────┴─────────────────┴──────────────┴──────┴─────┴───────┴────┘   │
│                                                                             │
│  ✅ Hoạt động    ❌ Vô hiệu hóa                                             │
│                                                                             │
│  Hiển thị 1-10 của 89 khách hàng                    < 1 2 3 ... 9 >        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 4.2 Form Tạo Khách hàng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Thêm khách hàng mới                                          [X]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Thông tin cơ bản ──────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Họ và tên *                                                        │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ Nguyễn Văn A                                               │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  Số điện thoại                  Loại khách hàng *                   │   │
│  │  ┌──────────────────────┐       ◉ Khách sỉ (Wholesale)              │   │
│  │  │ 0901234567           │       ○ Khách lẻ (Retail)                 │   │
│  │  └──────────────────────┘                                           │   │
│  │                                                                      │   │
│  │  Địa chỉ                                                            │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ 123 Nguyễn Huệ, Q.1, TP.HCM                                │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  Ghi chú                                                            │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ Khách quen, hay mua son môi                                │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ⓘ Sau khi tạo, hệ thống sẽ sinh mã KH.                                    │
│                                                                             │
│                                          [Hủy]  [Tạo khách hàng]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 4.3 Kết quả sau khi tạo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✅ Tạo khách hàng thành công!                                [X]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mã khách hàng: KH015                                                       │
│  Hồ sơ khách hàng đã được lưu.                                              │
│                                                                             │
│                                   [Đóng]                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 4.4 Chi tiết Khách hàng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Khách hàng: KH001 - Nguyễn Văn A                             [Sửa] [...]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Thông tin ─────────────────┐  ┌─ Thống kê ─────────────────────────┐   │
│  │                             │  │                                     │   │
│  │  Mã KH:     KH001           │  │  Tổng đơn hàng:      45 đơn        │   │
│  │  Loại:      🏪 Khách sỉ     │  │  Đơn thành công:     42 đơn        │   │
│  │  SĐT:       0901234567      │  │  Tổng chi tiêu:      12,500,000₫   │   │
│  │  Địa chỉ:   123 Nguyễn Huệ  │  │  Đơn gần nhất:       25/12/2024    │   │
│  │  Tạo ngày:  01/01/2024      │  │                                     │   │
│  │  Trạng thái: ✅ Hoạt động   │  │                                     │   │
│  │                             │  │                                     │   │
│  └─────────────────────────────┘  └─────────────────────────────────────┘   │
│                                                                             │
│  ┌─ Lịch sử đơn hàng ──────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Mã đơn              │ Ngày       │ Tổng tiền   │ Trạng thái        │   │
│  │  ORD-20241225-003    │ 25/12/2024 │ 1,200,000₫  │ ✅ Đã giao        │   │
│  │  ORD-20241220-015    │ 20/12/2024 │ 850,000₫    │ ✅ Đã giao        │   │
│  │  ORD-20241215-008    │ 15/12/2024 │ 2,100,000₫  │ ✅ Đã giao        │   │
│  │  ...                 │ ...        │ ...         │ ...               │   │
│  │                                                                      │   │
│  │                              Xem tất cả đơn hàng →                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ Hành động ─────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  [💬 Mở chat]    [🚫 Vô hiệu hóa]                                     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5. Logic xử lý

##### 5.1 Lấy danh sách Khách hàng

```typescript
// app/models/customer.server.ts

interface CustomerFilters {
  search?: string;
  customerType?: "wholesale" | "retail";
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getCustomers(supabase: SupabaseClient, filters: CustomerFilters) {
  const { search, customerType, isActive, page = 1, limit = 20 } = filters;
  
  let query = supabase
    .from("profiles")
    .select(`
      *,
      orders:orders(count),
      total_spent:orders(total.sum())
    `, { count: "exact" })
    .eq("role", "customer");
  
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,customer_code.ilike.%${search}%`);
  }
  
  if (customerType) {
    query = query.eq("customer_type", customerType);
  }
  
  if (isActive !== undefined) {
    query = query.eq("is_active", isActive);
  }
  
  const from = (page - 1) * limit;
  query = query
    .range(from, from + limit - 1)
    .order("created_at", { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    customers: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
```

##### 5.2 Tạo Khách hàng

```typescript
// app/models/customer.server.ts

export async function createCustomer(
  supabase: SupabaseClient,
  data: {
    fullName: string;
    phone?: string;
    address?: string;
    customerType: "wholesale" | "retail";
    note?: string;
  }
) {
  // Generate customer code
  const { data: lastCustomer } = await supabase
    .from("profiles")
    .select("customer_code")
    .like("customer_code", "KH%")
    .order("customer_code", { ascending: false })
    .limit(1)
    .single();
  
  const lastNumber = lastCustomer 
    ? parseInt(lastCustomer.customer_code.replace("KH", "")) 
    : 0;
  const newCode = `KH${String(lastNumber + 1).padStart(3, "0")}`;
  
  // Create profile only (no customer auth)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: null,
      role: "customer",
      full_name: data.fullName,
      phone: data.phone,
      address: data.address,
      customer_type: data.customerType,
      customer_code: newCode,
    })
    .select()
    .single();
  
  if (profileError) throw profileError;
  
  // Create chat room
  await supabase.from("chat_rooms").insert({
    customer_id: profile.id,
  });
  
  return {
    customer: profile,
    customerCode: newCode,
  };
}
```

##### 5.3 Vô hiệu hóa/Kích hoạt

```typescript
export async function toggleCustomerStatus(
  supabase: SupabaseClient,
  customerId: string,
  isActive: boolean
) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", customerId);
  
  if (error) throw error;
  
  return { success: true };
}
```

##### 5.4 Lấy thống kê Khách hàng

```typescript
export async function getCustomerStats(
  supabase: SupabaseClient,
  customerId: string
) {
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .eq("customer_id", customerId);
  
  const totalOrders = orders?.length || 0;
  const deliveredOrders = orders?.filter(o => o.status === "delivered").length || 0;
  const totalSpent = orders
    ?.filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  
  const lastOrder = orders
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders: totalOrders - deliveredOrders,
    totalSpent,
    lastOrderDate: lastOrder?.created_at,
  };
}
```

---

#### 6. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| full_name | Required, 2-255 chars | "Họ tên không hợp lệ" |
| phone | Optional, VN phone format | "Số điện thoại không hợp lệ" |
| address | Optional, max 500 chars | - |
| customer_type | Required, enum | "Vui lòng chọn loại khách hàng" |

##### VN Phone Validation
```typescript
const vnPhoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
```

---

#### 7. Test Cases

| TC ID | Scenario | Input | Expected |
|-------|----------|-------|----------|
| CUST-TC01 | Happy path | Valid customer data | Customer created with KH code |
| CUST-TC02 | Auto-increment | After KH015 | New code = KH016 |
| CUST-TC03 | Search by name | "Nguyễn" | Returns matching customers |
| CUST-TC04 | Filter by type | wholesale | Only wholesale customers |
| CUST-TC06 | Deactivate | Active customer | is_active = false |
| CUST-TC07 | Invalid phone | "abc123" | Validation error |
| CUST-TC08 | View history | Customer with orders | Shows order list |

---

#### 8. Security Considerations

- Không có đăng nhập cho khách hàng (chỉ lưu hồ sơ)
- Vô hiệu hóa account = không cho thao tác liên quan đến hồ sơ

---

**Lịch sử thay đổi:**

| Version | Ngày | Nội dung |
|---------|------|----------|
| 1.0 | 30/12/2024 | Khởi tạo tài liệu |
