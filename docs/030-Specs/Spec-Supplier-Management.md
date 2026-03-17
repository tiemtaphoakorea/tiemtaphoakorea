---
id: SPEC-018
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-30
updated: 2026-01-30
---

# Spec: Supplier Management

## Related Epics

- [[Epic-03-ProductManagement]] (Suppliers linked to products)
- [[Epic-06-OrderManagement]] (Supplier orders)

---

## 1. Overview

### 1.1 Purpose

This specification defines the Supplier Management feature for Auth Shop Platform. Suppliers are vendors from whom the shop purchases products, especially for pre-order items.

### 1.2 Scope

- CRUD operations for suppliers
- Supplier status management (active/inactive)
- Search and filtering
- Supplier statistics and order history
- Supplier orders (đơn nhập) created independently; no link to sales orders (orders/order_items)

### 1.3 Actors

| Actor   | Description                              |
| ------- | ---------------------------------------- |
| Owner   | Full access to supplier management       |
| Manager | Can create, update, and view suppliers   |
| Staff   | Read-only access to supplier information |

---

## 2. User Stories

### US-SUP-01: Create Supplier

**As an** Admin
**I want to** add new suppliers to the system
**So that** I can track where products are sourced from

**Acceptance Criteria:**

- Enter supplier name, phone, email, address
- System auto-generates supplier code (NCC-XXXXX)
- Supplier is created with status "active"
- Optional fields: payment terms, notes

### US-SUP-02: Update Supplier

**As an** Admin
**I want to** update supplier information
**So that** contact details stay current

**Acceptance Criteria:**

- Edit all supplier fields except code
- Changes are saved and reflected immediately
- Update timestamp is recorded

### US-SUP-03: Deactivate Supplier

**As an** Admin
**I want to** deactivate suppliers no longer in use
**So that** they don't appear in active selections

**Acceptance Criteria:**

- Deactivated suppliers are hidden from default lists
- Can be viewed with "include inactive" filter
- Existing supplier_orders (by supplier_id) remain; supplier_orders are independent of sales orders

### US-SUP-04: Search Suppliers

**As an** Admin
**I want to** search for suppliers
**So that** I can quickly find supplier information

**Acceptance Criteria:**

- Search by name, code, phone, or email
- Filter by status (active/inactive)
- Results sorted by name or recent activity

### US-SUP-05: View Supplier Statistics

**As an** Admin
**I want to** see supplier order statistics
**So that** I can evaluate supplier performance

**Acceptance Criteria:**

- Count of orders by status (pending, ordered, received, cancelled)
- Total cost value of orders
- Recent orders list

---

## 3. Data Model

### 3.1 Suppliers Table

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  payment_terms VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Supplier Code Generation

Format: `NCC-XXXXX` (e.g., NCC-00001)

```sql
CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(supplier_code FROM 5) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM suppliers;

  NEW.supplier_code := 'NCC-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_supplier_code
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION generate_supplier_code();
```

---

## 4. API Endpoints

### 4.1 List Suppliers

```
GET /api/admin/suppliers
Query: ?q=search&status=active&page=1&limit=20
Response: { suppliers: Supplier[], total: number }
```

### 4.2 Get Supplier Detail

```
GET /api/admin/suppliers/:id
Response: { supplier: Supplier, stats: SupplierStats, recentOrders: SupplierOrder[] }
```

### 4.3 Create Supplier

```
POST /api/admin/suppliers
Body: { name, phone?, email?, address?, payment_terms?, notes? }
Response: { supplier: Supplier }
```

### 4.4 Update Supplier

```
PATCH /api/admin/suppliers/:id
Body: { name?, phone?, email?, address?, payment_terms?, notes?, status? }
Response: { supplier: Supplier }
```

### 4.5 Delete Supplier

```
DELETE /api/admin/suppliers/:id
Response: { success: boolean }
Note: Only allowed if no supplier_orders exist
```

---

## 5. UI Design

### 5.1 Supplier List Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Quản lý Nhà Cung Cấp                                  [+ Thêm NCC]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Tìm kiếm NCC...                    [☑ Hiển thị NCC không hoạt động] │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────┬──────────────┬─────────────┬───────────┬─────────────────┐ │
│  │ Mã NCC  │ Tên          │ SĐT         │ Trạng thái│ Hành động       │ │
│  ├─────────┼──────────────┼─────────────┼───────────┼─────────────────┤ │
│  │ NCC-001 │ Công ty ABC  │ 0901234567  │ 🟢 Active │ [Sửa] [Chi tiết]│ │
│  │ NCC-002 │ Công ty XYZ  │ 0912345678  │ 🟢 Active │ [Sửa] [Chi tiết]│ │
│  │ NCC-003 │ Nhà phân phối│ 0923456789  │ 🔴 Inactive│ [Sửa] [Chi tiết]│ │
│  └─────────┴──────────────┴─────────────┴───────────┴─────────────────┘ │
│                                                                          │
│  Hiển thị 1-10 / 25 NCC                                [◀] [1] [2] [▶]  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Supplier Detail Sheet

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Chi tiết NCC: NCC-00001 - Công ty ABC                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  THÔNG TIN LIÊN HỆ                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📱 0901234567                                                      │ │
│  │ 📧 contact@abc.com                                                 │ │
│  │ 📍 123 Đường ABC, Quận 1, TP.HCM                                   │ │
│  │ 💳 Thanh toán: COD hoặc chuyển khoản                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  THỐNG KÊ ĐƠN HÀNG                                                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│  │ ⏳ Chờ đặt  │ 📦 Đã đặt   │ ✅ Đã nhận  │ ❌ Đã hủy   │             │
│  │     5       │     3       │     42      │     2       │             │
│  └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                          │
│  Tổng giá trị: 45,000,000đ                                              │
│                                                                          │
│  ĐƠN HÀNG GẦN ĐÂY                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ • Son XYZ-RED x3 - ORD-20260130-001 - ⏳ Chờ đặt                   │ │
│  │ • Kem ABC-001 x5 - ORD-20260129-003 - 📦 Đã đặt                    │ │
│  │ • Nước hoa NH-001 x2 - ORD-20260128-007 - ✅ Đã nhận               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                               [Sửa thông tin]  [Vô hiệu hóa]            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Validation Rules

| Field         | Rule                         | Message                      |
| ------------- | ---------------------------- | ---------------------------- |
| name          | Required, max 255 chars      | "Tên NCC là bắt buộc"        |
| phone         | Optional, valid phone format | "Số điện thoại không hợp lệ" |
| email         | Optional, valid email format | "Email không hợp lệ"         |
| address       | Optional, max 500 chars      | "Địa chỉ quá dài"            |
| payment_terms | Optional, max 255 chars      | -                            |

---

## 7. Business Rules

### 7.1 Supplier Code

- Auto-generated on creation
- Format: `NCC-XXXXX` (5-digit sequential)
- Cannot be modified after creation

### 7.2 Status Management

- New suppliers default to "active"
- Deactivated suppliers hidden from dropdowns/selections
- Existing relationships (supplier_orders) preserved when deactivated

### 7.3 Deletion Rules

- Cannot delete supplier with existing supplier_orders
- Use deactivation for suppliers no longer in use

---

## 8. Integration Points

### 8.1 Product Variants

Products can optionally be linked to a preferred supplier for reordering.

### 8.2 Supplier Orders

Supplier_orders are created independently by Admin (manual restocking); they can be grouped/viewed by supplier. No automatic creation from sales orders.

---

## 9. Test Cases

- [[TC-SUP-001]] - Create Supplier
- [[TC-SUP-002]] - Update Supplier Details
- [[TC-SUP-003]] - Deactivate Supplier
- [[TC-SUP-004]] - Supplier Search and Include Inactive
- [[TC-SUP-005]] - Supplier Stats and Recent Orders

---

## 10. Security Considerations

### 10.1 Row Level Security

```sql
-- Policy: Admin can view all suppliers
CREATE POLICY "Admins can view suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('owner', 'manager', 'staff')
  )
);

-- Policy: Only Owner/Manager can modify suppliers
CREATE POLICY "Owner/Manager can modify suppliers"
ON suppliers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('owner', 'manager')
  )
);
```

---

## 11. Revision History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | 2026-01-30 | Claude | Initial version |
