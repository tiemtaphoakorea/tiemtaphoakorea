---
id: SPEC-RBAC-Matrix
type: spec
status: active
project: Auth Shop Platform
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Authentication-Authorization]]
---

# Spec: RBAC Matrix (Owner / Manager / Staff / Customer)

Ma trận quyền tóm tắt quyền truy cập theo vai trò cho các module chính của Admin Portal và một số nhóm API quan trọng.

Thực tế triển khai bám sát `Spec-Authentication-Authorization` và code trong `lib/auth.server.ts` + các route dưới `app/api/admin/*`.

---

## 1. Ma trận quyền UI (Admin Portal)

| Module / Trang           | Route (chính)                | Owner | Manager | Staff | Customer | Ghi chú ngắn                                                        |
| ------------------------ | ---------------------------- | :---: | :-----: | :---: | :------: | ------------------------------------------------------------------- |
| Dashboard                | `/`                          |  ✅   |   ✅    |  ✅   |    ❌    | Tổng quan KPI, widget đơn hàng, cảnh báo tồn kho                    |
| Orders                   | `/orders`                    |  ✅   |   ✅    |  ✅   |    ❌    | Tạo/duyệt/cập nhật đơn, lịch sử trạng thái                          |
| Products & Categories    | `/products`, `/categories`   |  ✅   |   ✅    |  ✅   |    ❌    | CRUD sản phẩm, danh mục, biến thể, tồn kho                          |
| Supplier Orders          | `/supplier-orders`           |  ✅   |   ✅    |  ✅   |    ❌    | Đơn nhập hàng, cập nhật trạng thái, ảnh hưởng tồn kho               |
| Suppliers                | `/suppliers`                 |  ✅   |   ✅    |  ✅   |    ❌    | CRUD nhà cung cấp, thống kê NCC                                     |
| Customers (CRM)          | `/customers`                 |  ✅   |   ✅    |  ✅   |    ❌    | Hồ sơ khách hàng, lịch sử mua, thống kê                             |
| Chat (Admin Inbox)       | `/chat`                      |  ✅   |   ✅    |  ✅   |    ❌    | Hộp thư chat với khách, tin nhắn, unread count                      |
| Users (Nhân sự)          | `/users`                     |  ✅   |   ❌    |  ❌   |    ❌    | Quản lý user nội bộ (Owner-only)                                    |
| Finance Dashboard        | `/finance`                   |  ✅   |   ❌    |  ❌   |    ❌    | Tổng quan doanh thu / chi phí / P&L (Owner-only)                    |
| Expenses                 | `/expenses`                  |  ✅   |   ❌    |  ❌   |    ❌    | CRUD chi phí vận hành (Owner-only)                                  |
| Profit / Reports         | (finance/profit views)       |  ✅   |   ❌    |  ❌   |    ❌    | Báo cáo lãi/lỗ chi tiết, top sản phẩm, v.v. (Owner-only)            |
| Analytics (Báo cáo tổng) | `/analytics`                 |  ✅   |   ✅    |  ❌   |    ❌    | Báo cáo tổng quan (doanh thu, top sản phẩm, phân bổ theo danh mục…) |
| Customer Catalog (Store) | `/` (storefront), `/product` |  ❌   |   ❌    |  ❌   |    ✅    | Catalog public cho khách, không yêu cầu login                       |

Ghi nhớ:

- **Owner**: Full access toàn bộ module nội bộ.
- **Manager**: Toàn quyền vận hành (Orders/Products/Customers/Suppliers/Chat) + xem **Analytics**, nhưng **không** truy cập Users/Finance/Expenses/Profit.
- **Staff**: Chỉ module vận hành (Orders/Products/Supplier Orders/Suppliers/Customers/Chat), **không** có Analytics, Users, Finance, Expenses.
- **Customer**: Chỉ xem catalog/product detail ở storefront, không vào Admin.

---

## 2. Ma trận quyền API chính (tương ứng backend)

| Nhóm API                         | Route prefix / Endpoint                | Owner | Manager | Staff | Customer | Ghi chú                                                                                           |
| -------------------------------- | -------------------------------------- | :---: | :-----: | :---: | :------: | ------------------------------------------------------------------------------------------------- |
| Orders API                       | `/api/admin/orders*`                   |  ✅   |   ✅    |  ✅   |    ❌    | CRUD đơn hàng, thanh toán, lịch sử                                                                |
| Products API                     | `/api/admin/products*`, `/categories*` |  ✅   |   ✅    |  ✅   |    ❌    | CRUD sản phẩm, danh mục, biến thể                                                                 |
| Supplier Orders API              | `/api/admin/supplier-orders*`          |  ✅   |   ✅    |  ✅   |    ❌    | CRUD đơn nhập hàng, cập nhật trạng thái                                                           |
| Suppliers API                    | `/api/admin/suppliers*`                |  ✅   |   ✅    |  ✅   |    ❌    | CRUD nhà cung cấp, thống kê NCC                                                                   |
| Customers API (CRM)              | `/api/admin/customers*`                |  ✅   |   ✅    |  ✅   |    ❌    | CRUD hồ sơ khách, thống kê                                                                        |
| Chat API (admin side)            | `/api/admin/chat*`                     |  ✅   |   ✅    |  ✅   |    ❌    | Inbox, danh sách phòng, tin nhắn                                                                  |
| Users API                        | `/api/admin/users*`                    |  ✅   |   ❌    |  ❌   |    ❌    | CRUD user nội bộ, reset password (Owner-only, mapped trong code qua `getInternalUser` + `ROLE`)   |
| Finance API                      | `/api/admin/finance`                   |  ✅   |   ❌    |  ❌   |    ❌    | Thống kê tài chính theo tháng/khoảng thời gian (Owner-only)                                       |
| Expenses API                     | `/api/admin/expenses*`                 |  ✅   |   ❌    |  ❌   |    ❌    | CRUD chi phí vận hành (Owner-only)                                                                |
| Profit Stats API                 | `/api/admin/stats/profit`              |  ✅   |   ❌    |  ❌   |    ❌    | Báo cáo profit chi tiết (Owner-only)                                                              |
| Analytics API                    | `/api/admin/analytics`                 |  ✅   |   ✅    |  ❌   |    ❌    | Dashboard analytics tổng quan                                                                     |
| Admin Stats API (dashboard KPIs) | `/api/admin/stats`                     |  ✅   |   ✅    |  ✅   |    ❌    | KPI dashboard, top products, recent orders                                                        |
| Profile API (admin profile)      | `/api/admin/profile`                   |  ✅   |   ✅    |  ✅   |    ❌    | Thông tin profile nội bộ của user đăng nhập                                                       |
| Upload API                       | `/api/upload`                          |  ✅   |   ✅    |  ❌   |    ❌    | Upload file (ảnh sản phẩm/chat). Chỉ Owner + Manager, Staff không được upload theo test security. |
| Storefront API (public/catalog)  | `/api/store/*` (nếu có)                |  ❌   |   ❌    |  ❌   |    ✅    | Endpoint public cho khách (xem sản phẩm, v.v.)                                                    |

---

## 3. Ghi chú mapping với test & tài liệu QA

- **TC-AUTH-009 – Manager Login & Role Restrictions**:
  - Kiểm tra Manager **thấy Analytics + module vận hành** nhưng **không** thấy Users/Finance/Expenses/Profit.
- **TC-AUTH-010 – Role-Based Access Restrictions by Module**:
  - Staff bị chặn Users/Finance/Expenses/Analytics.
  - Manager bị chặn Users/Finance/Expenses nhưng vẫn vào Analytics & module vận hành.
- **TC-AUTH-011 – Owner-Only API Access**:
  - Staff gọi API Users/Finance/Expenses/Profit nhận 401/403.
  - Owner gọi các API này thành công.

Ma trận này nên được giữ đồng bộ với:

- `lib/auth.server.ts` (`requireRole`, `requireInternalUser`, `changeAdminPassword`, `getInternalUser`).
- Các route `app/api/admin/*` (đặc biệt: `users`, `finance`, `expenses`, `stats/profit`, `analytics`, `upload`).
- UI điều hướng trong `components/layout/AdminSidebar.tsx`.
