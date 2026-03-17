---
id: PRD-001
type: prd
status: approved
project: Auth Shop Platform
owner: @User
created: 2026-01-19
tags: [mvp, phase-1, internal-tool]
---

# PRD: Internal Shop Management System - Phase 1 (MVP)

## 1. Introduction

This project aims to build an **Internal Shop Management System** (Phase 1 MVP) to manage products, orders, customers, and internal accounting. The system is designed for internal use by Owners, Managers, and Staff, with a read-only view for Customers.

## 2. Goals & Objectives

- **Efficiency**: Streamline shop operations (inventory, orders, accounting).
- **Control**: Role-based access control for different staff levels.
- **Transparency**: Real-time business insights (P&L, Revenue).

## 3. User Roles

- **Owner (Chủ cửa hàng)**: Full access to all modules, including financial reports and sensitive settings.
- **Manager (Quản lý)**: Management access but restricted from viewing specialized financial reports (P&L) if configured.
- **Staff (Nhân viên)**: Basic access for order processing and product interaction.
- **Customer (Khách hàng)**: Read-only access to view product catalog and details.

## 4. Functional Requirements (Modules)

### Module 1: Setup & Infrastructure

- **Tech Stack**: Next.js, Supabase (Auth, DB, Realtime, Storage), Tailwind/shadcn-ui, Vercel.
- **Database**: Robust Schema design.
- **System**: Deployment pipeline setup.

### Module 2: Authentication & Authorization

- **Admin Login**: Supabase Auth integration.
- **Session Management**: Secure session handling.
- **Password Reset**: Restricted to Owner.
- **RBAC**: Implementation of Owner/Manager/Staff roles.

### Module 3: Product Management (Admin)

- **CRUD Operations**: Categories, Products, Variants (Options), Suppliers.
- **Images**: Upload via Supabase Storage.
- **Inventory**: Stock management per variant.
- **Pricing**: Cost price (entry price) vs Retail/Wholesale price.
- **Search/Filter**: Advanced search and pagination.

### Module 4: Customer Page (View Only)

- **Catalog**: Public/Authenticated view of products.
- **Details**: Price, stock status, descriptions, variants.
- **Search**: Customer-facing search and filtering.

### Module 5: Customer Management

- **CRUD Customers**: Manage customer profiles (Auto-generate code).
- **History**: View purchase history (linked to Orders).

### Module 6: Order Management

- **Admin-created Orders**: Staff creates orders for customers.
- **Order Logic**:
  - Split items (In-stock vs Pre-order).
  - Partial payments and multiple deliveries.
  - Partial cancellations.
- **Statuses**:
  - Order: Pending, Paid, Preparing, Shipping, Delivered, Cancelled.
  - Item: Pending, Ordered, Received, Cancelled.
- **Server Actions**: Update status, Cancel, Exchange, Return.

### Module 7: Payment

- **Flexible Payments**: Partial or Full payments per order.
- **Tracking**: Payment history logs, calculating remaining balance.
- **Statuses (Derived)**: Unpaid, Partially Paid, Paid (based on `paid_amount` vs `total`). When fully paid, Order status becomes `paid`.

### Module 8: Real-time Chat

- **Tech**: Supabase Realtime.
- **Flow**: Direct messaging between Admin and Customer (via website).
- **Features**: Image upload, Unread counts, Conversation list (Admin side).

### Module 9: Accounting

- **Cost Management**: Tracking Cost Price per variant.
- **Expenses**: Fixed and Variable operational costs.
- **Reconciliation**:
  - Debt management.
  - Revenue checks.
  - Inventory audits.

### Module 10: Dashboard & Reports

- **Visuals**: Charts for Revenue/Profit over time.
- **P&L**: Profit & Loss report (Revenue - Expenses).
- **Product Insights**: Sales performance by product.
- **Comparisons**: Period-over-period growth.
- **Suggestions**: Re-order alerts for low stock.

## Related Specs

- [[Spec-Authentication-Authorization]]
- [[Spec-Product-Management]]
- [[Spec-Customer-Catalog]]
- [[Spec-Customer-CRM]]
- [[Spec-Order-Management]]
- [[Spec-Finance-Accounting]]
- [[Spec-Chat-System]]
- [[Spec-Dashboard-Reports]]

## 5. Non-Functional Requirements

- **Performance**: High responsiveness for Admin tasks.
- **Security**: Strict RLS policies on Supabase.
- **Usability**: Clean, modern UI (Glassmorphism/Premium feel).

## 6. Assumptions & Constraints

- **Timeline**: 4 Weeks (20 working days).
- **Hosting**: Self-hosted or SaaS (Vercel/Supabase free/pro tiers).
