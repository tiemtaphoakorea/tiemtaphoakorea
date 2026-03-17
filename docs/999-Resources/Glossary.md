---
id: RES-Glossary
type: glossary
status: active
project: Auth Shop Platform
created: 2026-01-30
updated: 2026-01-30
---

# Glossary / Bảng Thuật Ngữ

Standardized terminology used across Auth Shop Platform documentation.

---

## User Roles / Vai Trò Người Dùng

| English Term | Vietnamese Term   | Code/DB Value | Description                                      |
| ------------ | ----------------- | ------------- | ------------------------------------------------ |
| Owner        | Chủ cửa hàng      | `owner`       | Full system access, including financial reports  |
| Manager      | Quản lý           | `manager`     | Management access, restricted from some reports  |
| Staff        | Nhân viên         | `staff`       | Basic access for order processing                |
| Customer     | Khách hàng        | `customer`    | Read-only access to product catalog              |

> **Note**: "Admin" refers collectively to Owner, Manager, and Staff (internal users with admin panel access). "Owner" is the specific highest-privilege role.

---

## Order Management / Quản Lý Đơn Hàng

| English Term      | Vietnamese Term        | Code/DB Value  | Description                                |
| ----------------- | ---------------------- | -------------- | ------------------------------------------ |
| Order             | Đơn hàng               | `orders`       | A purchase transaction                     |
| Order Item        | Sản phẩm trong đơn     | `order_items`  | Individual line item in an order           |
| Order Number      | Mã đơn hàng            | `order_number` | Auto-generated: ORD-YYYYMMDD-XXX           |
| Supplier Order    | Đơn đặt NCC            | `supplier_orders` | Order to supplier for pre-order items   |

### Order Statuses / Trạng Thái Đơn Hàng

| English       | Vietnamese          | Code Value    |
| ------------- | ------------------- | ------------- |
| Pending       | Chờ xử lý           | `pending`     |
| Paid          | Đã thanh toán       | `paid`        |
| Preparing     | Đang chuẩn bị       | `preparing`   |
| Shipping      | Đang giao           | `shipping`    |
| Delivered     | Đã giao             | `delivered`   |
| Cancelled     | Đã hủy              | `cancelled`   |

---

## Product Management / Quản Lý Sản Phẩm

| English Term      | Vietnamese Term    | Code/DB Value      | Description                              |
| ----------------- | ------------------ | ------------------ | ---------------------------------------- |
| Product           | Sản phẩm           | `products`         | Main product entity                      |
| Variant           | Biến thể           | `product_variants` | Product variation (size, color, etc.)    |
| Category          | Danh mục           | `categories`       | Product categorization                   |
| SKU               | Mã SKU             | `sku`              | Stock Keeping Unit identifier            |
| Stock Quantity    | Số lượng tồn kho   | `stock_quantity`   | Available inventory count                |

### Stock Types / Loại Tồn Kho

| English       | Vietnamese          | Code Value    | Description                              |
| ------------- | ------------------- | ------------- | ---------------------------------------- |
| In Stock      | Có sẵn              | `in_stock`    | Available in inventory                   |
| Pre-order     | Đặt trước / Cần đặt NCC | `pre_order` | Requires ordering from supplier       |

---

## Financial Terms / Thuật Ngữ Tài Chính

| English Term      | Vietnamese Term    | Code/DB Field      | Description                              |
| ----------------- | ------------------ | ------------------ | ---------------------------------------- |
| Price             | Giá bán            | `price`            | Selling price to customer                |
| Cost Price        | Giá vốn / Giá nhập | `cost_price`       | Purchase price from supplier             |
| Profit            | Lợi nhuận          | `profit`           | Revenue minus cost                       |
| Subtotal          | Tạm tính           | `subtotal`         | Total before discounts                   |
| Discount          | Giảm giá           | `discount`         | Price reduction                          |
| Total             | Tổng tiền          | `total`            | Final amount (subtotal - discount)       |
| Paid Amount       | Số tiền đã trả     | `paid_amount`      | Amount customer has paid                 |
| Revenue           | Doanh thu          | -                  | Total income from sales                  |
| Expense           | Chi phí            | `expenses`         | Operational costs                        |
| P&L               | Lãi/Lỗ             | -                  | Profit and Loss report                   |

---

## Customer Management / Quản Lý Khách Hàng

| English Term      | Vietnamese Term    | Code/DB Value      | Description                              |
| ----------------- | ------------------ | ------------------ | ---------------------------------------- |
| Customer          | Khách hàng         | `profiles`         | Customer profile record                  |
| Customer Code     | Mã khách hàng      | `customer_code`    | Auto-generated: KH-XXXXX                 |
| Wholesale         | Khách sỉ           | `wholesale`        | Bulk buyer with special pricing          |
| Retail            | Khách lẻ           | `retail`           | Regular individual customer              |

> **Note**: In the database, both staff and customers are stored in the `profiles` table. "Customer" in business context refers to profiles with `role = 'customer'`.

---

## Actions / Hành Động

| English Term      | Vietnamese Term    | Description                                        |
| ----------------- | ------------------ | -------------------------------------------------- |
| Create            | Tạo mới            | Add a new record                                   |
| Update            | Cập nhật           | Modify existing record                             |
| Delete            | Xóa                | Remove record from database                        |
| Cancel            | Hủy                | Change status to cancelled (not delete)            |
| Confirm           | Xác nhận           | Approve or verify an action                        |
| Search            | Tìm kiếm           | Query for records                                  |
| Filter            | Lọc                | Narrow down results by criteria                    |

---

## Technical Terms / Thuật Ngữ Kỹ Thuật

| Abbreviation | Full Term                 | Vietnamese          | Description                              |
| ------------ | ------------------------- | ------------------- | ---------------------------------------- |
| CRUD         | Create, Read, Update, Delete | Tạo, Đọc, Sửa, Xóa | Basic data operations                  |
| RBAC         | Role-Based Access Control | Phân quyền theo vai trò | Access control by user role          |
| RLS          | Row Level Security        | Bảo mật cấp hàng    | Database security at row level           |
| API          | Application Programming Interface | Giao diện lập trình | Programmatic interface              |
| UI           | User Interface            | Giao diện người dùng | Visual interface                        |
| NCC          | Nhà Cung Cấp              | Supplier            | Product supplier                         |
| KH           | Khách Hàng                | Customer            | Customer (abbreviation)                  |

---

## Status Values / Giá Trị Trạng Thái

### General Status

| English       | Vietnamese     | Code Value    |
| ------------- | -------------- | ------------- |
| Active        | Hoạt động      | `active`      |
| Inactive      | Không hoạt động| `inactive`    |
| Pending       | Chờ xử lý      | `pending`     |
| Approved      | Đã duyệt       | `approved`    |
| Draft         | Bản nháp       | `draft`       |

### Supplier Order Status

| English       | Vietnamese     | Code Value    |
| ------------- | -------------- | ------------- |
| Pending       | Chờ đặt        | `pending`     |
| Ordered       | Đã đặt NCC     | `ordered`     |
| Received      | Đã nhận        | `received`    |
| Cancelled     | Đã hủy         | `cancelled`   |

---

## Related Documents

- [[PRD-AuthShopPlatform]] - Full requirements
- [[Spec-Order-Management]] - Order terminology in context
- [[Spec-Product-Management]] - Product terminology in context
