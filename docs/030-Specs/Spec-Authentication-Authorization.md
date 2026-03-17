---
id: SPEC-010
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Authentication & Authorization

## Related Epics

- [[Epic-01-Infrastructure]]
- [[Epic-02-Authentication]]

## Module Notes

### Module 1 & 2: Infrastructure & Authentication (Cơ sở hạ tầng & Bảo mật)

**Mục tiêu**: Thiết lập nền tảng công nghệ và hệ thống phân quyền (RBAC) cho nội bộ.

---

#### 1. Tính Năng (Features)

- **1.1 Setup Project**:
  - **Framework**: Next.js 15 (App Router) - _Latest Standard_.
  - **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives).
  - **Language**: TypeScript 5.x.
- **1.2 Database & ORM**:
  - **DB**: Supabase (PostgreSQL).
  - **ORM**: Drizzle ORM (Lightweight, Serverless-ready).
- **1.3 Authentication**:
  - **Strategy**: Username/Password (Self-managed).
  - **Security**: Passwords hashed with `bcrypt`.
  - **Session**: JWT stored in HTTP-only Cookie (`admin_session`).
- **1.4 Authorization (RBAC)**:
  - **Owner**: Admin toàn quyền (Quản lý User, System Settings, Finance, Expenses, Reports).
  - **Manager**: Quản lý vận hành (Không xem báo cáo tài chính chi tiết & cấu hình hệ thống sâu; được xem Analytics tổng quan).
  - **Staff**: Nhân viên bán hàng/kho (Thao tác đơn hàng, sản phẩm và các module vận hành).

---

#### 2. Thiết Kế (Design)

##### UI Components

- **LoginPage**: Form đăng nhập với Shadcn `Form`.
- **AdminLayout**:
  - **Server Component**: Fetch User Role từ session cookies.
  - **Sidebar**: Render menu dựa trên Role đã fetch.
- **UserManagement**:
  - TanStack Table (React Table v8) cho danh sách users.

##### System Architecture

- **Middleware Pattern**:
  - Chặn tất cả route trên admin subdomain nếu không có valid JWT session.
- **Data Fetching**:
  - Sử dụng **React Server Components (RSC)** mặc định để fetch data an toàn từ DB.
- **Server Actions**: hàm `use server` cho mutation nội bộ (form `action`/`useActionState`).

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Authentication Flow (Custom JWT)

1. User truy cập `/login`.
2. User nhập Username & Password.
3. Server:
   - Tìm user trong bảng `profiles` bằng `username`.
   - Verify password hash (`bcrypt`).
   - Nếu hợp lệ -> Tạo JWT Token -> Set Cookie `admin_session`.
4. Middleware:
   - Check Cookie `admin_session`.
   - Verify JWT.
   - Nếu valid -> Cho phép truy cập & Inject User info vào Header.
   - Nếu invalid -> Redirect login.

##### 3.2 Role-Based Access Control (RBAC)

```typescript
// utils/auth.server.ts
export async function requireRole(allowedRoles: string[]) {
  const user = await getInternalUser(); // Parse JWT/Cookie
  if (!user) redirect("/login");

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
}
```

##### 3.3 RBAC theo Module (Thực tế triển khai)

| Module / Trang           | Owner | Manager | Staff | Customer |
| ------------------------ | :---: | :-----: | :---: | :------: |
| Dashboard                |  ✅   |   ✅    |  ✅   |    ❌    |
| Orders                   |  ✅   |   ✅    |  ✅   |    ❌    |
| Products & Categories    |  ✅   |   ✅    |  ✅   |    ❌    |
| Supplier Orders          |  ✅   |   ✅    |  ✅   |    ❌    |
| Suppliers                |  ✅   |   ✅    |  ✅   |    ❌    |
| Customers (CRM)          |  ✅   |   ✅    |  ✅   |    ❌    |
| Chat (Admin Inbox)       |  ✅   |   ✅    |  ✅   |    ❌    |
| Users (Nhân sự)          |  ✅   |   ❌    |  ❌   |    ❌    |
| Finance Dashboard        |  ✅   |   ❌    |  ❌   |    ❌    |
| Expenses                 |  ✅   |   ❌    |  ❌   |    ❌    |
| Profit / Reports         |  ✅   |   ❌    |  ❌   |    ❌    |
| Analytics (Báo cáo tổng) |  ✅   |   ✅    |  ❌   |    ❌    |
| Customer Catalog (Store) |  ❌   |   ❌    |  ❌   |    ✅    |

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`profiles`**:
  - `id`: uuid (Primary Key)
  - `username`: varchar (Unique Login ID)
  - `passwordHash`: varchar (Bcrypt hash)
  - `role`: enum (`owner`, `manager`, `staff`)
  - `fullName`: varchar
  - `permissions`: jsonb (Optional: Granular permissions override)

---

#### 5. User Stories

##### Admin Stories

| ID      | User Story                                                                         | Priority |
| ------- | ---------------------------------------------------------------------------------- | -------- |
| AUTH-01 | Là Admin nội bộ (Owner/Manager/Staff), tôi muốn đăng nhập để truy cập Admin Portal | Must     |
| AUTH-02 | Là Admin nội bộ (Owner/Manager/Staff), tôi muốn đăng xuất để bảo mật khi rời máy   | Must     |
| AUTH-03 | Là Owner, tôi muốn tạo tài khoản cho nhân viên (Staff/Manager)                     | Must     |
| AUTH-05 | Là Owner, tôi muốn vô hiệu hóa hoặc kích hoạt lại tài khoản nhân viên khi cần      | Should   |

---

#### 6. Thiết kế UI

##### Màn hình Đăng nhập

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │    🏪 SHOP ADMIN    │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │ Tên đăng nhập       │                      │
│                    │ admin               │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │ Mật khẩu            │                      │
│                    │ ••••••••••          │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │     ĐĂNG NHẬP       │                      │
│                    └─────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 7. Validation Rules

| Field    | Rule                  | Error Message                      |
| -------- | --------------------- | ---------------------------------- |
| username | Required              | "Vui lòng nhập tên đăng nhập"      |
| password | Required, min 6 chars | "Mật khẩu phải có ít nhất 6 ký tự" |

---

#### 8. Security Considerations

##### 8.1 Password Security

- Passwords hashed with `bcrypt`.
- Minimum 6 characters.

##### 8.2 Session Security

- HTTP-only cookies for session storage (`admin_session`).
- Secure flag in production (HTTPS only).
- Session expires after 7 days.

---

## User Management (Quản lý Người dùng Nội bộ)

### 9. Overview

User Management allows Owners to create, update, and manage internal staff accounts (Managers and Staff roles).

### 9.1 Features

- Create internal users with role assignment
- Update user profile and role
- Activate/deactivate user accounts
- View user list with search and filters

### 9.2 User Stories

| ID      | User Story                                                              | Priority |
| ------- | ----------------------------------------------------------------------- | -------- |
| USER-01 | As Owner, I want to create staff accounts so they can access the system | Must     |
| USER-02 | As Owner, I want to update user roles to adjust permissions             | Must     |
| USER-03 | As Owner, I want to deactivate users so they cannot login               | Must     |
| USER-04 | As Owner, I want to reactivate users to restore their access            | Should   |
| USER-05 | As Owner, I want to search users by name or email                       | Should   |

### 9.3 UI Design

#### User List Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Quản lý Người dùng                                    [+ Thêm User]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Tìm theo tên, email...              [☑ Hiển thị user không hoạt động] │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────┬─────────────┬─────────────┬───────────┬─────────────┐ │
│  │ Họ tên       │ Email       │ Vai trò     │ Trạng thái│ Hành động   │ │
│  ├──────────────┼─────────────┼─────────────┼───────────┼─────────────┤ │
│  │ Nguyễn Văn A │ a@shop.com  │ Manager     │ 🟢 Active │ [Sửa]       │ │
│  │ Trần Thị B   │ b@shop.com  │ Staff       │ 🟢 Active │ [Sửa]       │ │
│  │ Lê Văn C     │ c@shop.com  │ Staff       │ 🔴 Inactive│ [Sửa]      │ │
│  └──────────────┴─────────────┴─────────────┴───────────┴─────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Add/Edit User Form

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Thêm người dùng mới                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Họ và tên *                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Email *                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Số điện thoại                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Vai trò *                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ○ Manager    ○ Staff                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                              [Hủy]    [💾 Lưu]          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9.4 API Endpoints

#### List Users

```
GET /api/admin/users
Query: ?q=search&status=active&role=staff&page=1&limit=20
Response: { users: User[], total: number }
```

#### Create User

```
POST /api/admin/users
Body: { fullName, email, phone?, role }
Response: { user: User, temporaryPassword: string }
```

#### Update User

```
PATCH /api/admin/users/:id
Body: { fullName?, email?, phone?, role?, status? }
Response: { user: User }
```

### 9.5 Validation Rules

| Field    | Rule                         | Error Message                |
| -------- | ---------------------------- | ---------------------------- |
| fullName | Required, max 255 chars      | "Họ tên là bắt buộc"         |
| email    | Required, valid email format | "Email không hợp lệ"         |
| phone    | Optional, valid phone format | "Số điện thoại không hợp lệ" |
| role     | Required, enum value         | "Vui lòng chọn vai trò"      |

### 9.6 Business Rules

1. **Role Assignment**:

   - Owner can create Manager and Staff
   - Manager cannot create other users
   - Staff cannot access user management

2. **Deactivation**:

   - Deactivated users cannot login
   - Existing sessions are invalidated on deactivation
   - Can be reactivated by Owner

3. **Password Management**:
   - Temporary password generated on user creation
   - User must change password on first login
   - Only Owner can reset passwords

### 9.7 Test Cases

- [[TC-USER-001]] - Create Internal User
- [[TC-USER-002]] - Update User Profile & Role
- [[TC-USER-003]] - Deactivate User Blocks Access
- [[TC-USER-004]] - Create User Validation Errors
- [[TC-USER-005]] - Reactivate User Restores Access

---

**Lịch sử thay đổi:**

| Version | Ngày       | Nội dung                                    |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 30/12/2024 | Khởi tạo tài liệu                           |
| 1.1     | 29/01/2026 | Update to Username-only Auth                |
| 1.2     | 30/01/2026 | Add User Management section                 |
| 1.3     | 02/02/2026 | Cập nhật ma trận RBAC (Owner/Manager/Staff) |
