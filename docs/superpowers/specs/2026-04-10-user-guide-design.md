# K-SMART User Guide — Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Topic:** Vietnamese user guide for admin staff using Mintlify

---

## Overview

Build a standalone static documentation site using **Mintlify** that guides K-SMART admin staff through all features of the admin dashboard. The site is in **Vietnamese**, with **English file names**. No login required — hosted separately from the main apps.

---

## Target Audience

Internal admin staff only (not customers). Three roles, each with their own dedicated guide tab:

| Role | Vietnamese | Access level |
|------|-----------|--------------|
| Owner | Chủ shop | All features including Finance, HR, Expenses |
| Manager | Quản lý | All operational features + Analytics |
| Staff | Nhân viên | All operational features (no Finance/HR/Analytics) |

---

## Architecture

### Technology

- **Mintlify** — documentation framework (MDX-based, generates static site)
- **Language:** Vietnamese content, English file/folder names
- **Deployment:** Standalone static site, no authentication required

### Directory Structure

```
docs/guide/
├── mint.json              # Mintlify config (tabs, colors, logo, nav)
├── owner/
│   ├── introduction.mdx
│   ├── dashboard.mdx
│   ├── products.mdx
│   ├── categories.mdx
│   ├── orders.mdx
│   ├── supplier-orders.mdx
│   ├── suppliers.mdx
│   ├── customers.mdx
│   ├── chat.mdx
│   ├── expenses.mdx       # Owner only
│   ├── finance.mdx        # Owner only
│   ├── users.mdx          # Owner only
│   └── analytics.mdx
├── manager/
│   ├── introduction.mdx
│   ├── dashboard.mdx
│   ├── products.mdx
│   ├── categories.mdx
│   ├── orders.mdx
│   ├── supplier-orders.mdx
│   ├── suppliers.mdx
│   ├── customers.mdx
│   ├── chat.mdx
│   └── analytics.mdx
└── staff/
    ├── introduction.mdx
    ├── dashboard.mdx
    ├── products.mdx
    ├── categories.mdx
    ├── orders.mdx
    ├── supplier-orders.mdx
    ├── suppliers.mdx
    ├── customers.mdx
    └── chat.mdx
```

### Mintlify Navigation (mint.json)

Three top-level tabs map directly to roles:

- **Chủ shop** → `owner/*`
- **Quản lý** → `manager/*`
- **Nhân viên** → `staff/*`

Each tab has a sidebar listing all features available to that role.

---

## Feature Coverage by Role

| Tính năng | Chủ shop | Quản lý | Nhân viên |
|-----------|:--------:|:-------:|:---------:|
| Dashboard & KPI | ✅ | ✅ | ✅ |
| Sản phẩm | ✅ | ✅ | ✅ |
| Danh mục | ✅ | ✅ | ✅ |
| Đơn hàng | ✅ | ✅ | ✅ |
| Nhập hàng | ✅ | ✅ | ✅ |
| Nhà cung cấp | ✅ | ✅ | ✅ |
| Khách hàng | ✅ | ✅ | ✅ |
| Tin nhắn | ✅ | ✅ | ✅ |
| Chi phí | ✅ | — | — |
| Tài chính | ✅ | — | — |
| Nhân sự | ✅ | — | — |
| Báo cáo & Phân tích | ✅ | ✅ | — |

---

## Content Structure per Page

Each `.mdx` page follows this template:

1. **Tiêu đề** — tên tính năng
2. **Mô tả ngắn** — tính năng này dùng để làm gì
3. **Cách truy cập** — đường dẫn trong admin (e.g., Menu → Sản phẩm)
4. **Các thao tác chính** — danh sách bước thực hiện
5. **Lưu ý / Tips** — callout box với mẹo hoặc cảnh báo quan trọng

---

## Mintlify Configuration

`mint.json` will configure:
- **Name:** K-SMART Hướng dẫn sử dụng
- **Logo:** K-SMART logo (light + dark)
- **Colors:** Match K-SMART design system (primary: indigo/slate)
- **Tabs:** 3 tabs (Chủ shop, Quản lý, Nhân viên)
- **Search:** Enabled (Mintlify built-in)
- **Favicon:** K-SMART favicon

---

## Out of Scope

- Customer storefront guide
- API documentation
- Interactive onboarding tours or tooltips within the admin app
- Screenshots (placeholder noted — can be added later)
- Versioning / multi-language support beyond Vietnamese
