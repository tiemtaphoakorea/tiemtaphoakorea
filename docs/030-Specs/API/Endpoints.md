---
id: SPEC-003
type: spec
status: draft
project: Auth Shop Platform
created: 2026-01-21
updated: 2026-01-28
---

# API Endpoints & Routes

This document lists the current Next.js App Router **pages** and **Route Handlers** based on the codebase.

## 1. App Routes (Pages)

| Route                         | Method | Purpose                                      | Access |
| :---------------------------- | :----- | :------------------------------------------- | :----- |
| `/`                           | GET    | Storefront home (shop domain)                | Public |
| `/products`                   | GET    | Product listing (shop domain)                | Public |
| `/products/[slug]`            | GET    | Product detail (shop domain)                 | Public |
| `/login`                      | GET    | Admin login UI (admin subdomain)             | Public |
| `/`                           | GET    | Admin dashboard (admin subdomain)            | Staff+ |
| `/analytics`                  | GET    | Analytics view (admin subdomain)             | Staff+ |
| `/categories`                 | GET    | Category management (admin subdomain)        | Staff+ |
| `/customers`                  | GET    | Customer list (admin subdomain)              | Staff+ |
| `/customers/[id]`             | GET    | Customer detail (admin subdomain)            | Staff+ |
| `/orders`                     | GET    | Order list (admin subdomain)                 | Staff+ |
| `/orders/new`                 | GET    | Manual order creation UI (admin subdomain)   | Staff+ |
| `/orders/[id]`                | GET    | Order detail (admin subdomain)               | Staff+ |
| `/products`                   | GET    | Product list (admin subdomain)               | Staff+ |
| `/products/new`               | GET    | Product creation UI (admin subdomain)        | Staff+ |
| `/products/[id]/edit`         | GET    | Product edit UI (admin subdomain)            | Staff+ |
| `/suppliers`                  | GET    | Supplier list (admin subdomain)              | Staff+ |
| `/supplier-orders`            | GET    | Supplier order list (admin subdomain)        | Staff+ |
| `/settings`                   | GET    | Settings (admin subdomain)                   | Staff+ |

## 2. Route Handlers (HTTP APIs)

| Route                                      | Method           | Purpose                               | Access |
| :----------------------------------------- | :--------------- | :------------------------------------ | :----- |
| `/api/login`                               | POST             | Admin login (Supabase Auth)           | Public |
| `/api/admin/profile`                       | GET              | Current admin profile                 | Staff+ |
| `/api/admin/stats`                         | GET              | Dashboard stats                       | Staff+ |
| `/api/admin/analytics`                     | GET              | Analytics data (KPIs, charts, top products) | Owner/Admin |
| `/api/admin/products`                      | GET, POST         | List / create products                | Staff+ |
| `/api/admin/products/[id]`                 | PUT, DELETE       | Update / delete product               | Staff+ |
| `/api/admin/categories`                    | GET, POST         | List / create categories            | Staff+ |
| `/api/admin/categories/[id]`               | PUT, DELETE       | Update / delete category            | Staff+ |
| `/api/admin/orders`                        | GET, POST         | List / create orders                  | Staff+ |
| `/api/admin/orders/[id]`                   | GET, PUT, DELETE  | Get / update / delete order           | Staff+ |
| `/api/admin/orders/[id]/status`            | PATCH            | Update order status                   | Staff+ |
| `/api/admin/orders/[id]/payments`          | POST             | Record payment                        | Staff+ |
| `/api/admin/customers`                     | GET, POST         | List / create customers              | Staff+ |
| `/api/admin/customers/[id]`                | GET, PUT          | Get / update customer                | Staff+ |
| `/api/admin/customers/[id]/status`         | PATCH            | Toggle customer active status        | Staff+ |
| `/api/admin/customers/[id]/reset-password` | POST             | Reset customer password              | Staff+ |
| `/api/admin/suppliers`                     | GET, POST         | List / create suppliers              | Staff+ |
| `/api/admin/suppliers/[id]`                | PUT, DELETE       | Update / delete supplier             | Staff+ |
| `/api/admin/supplier-orders`               | GET, POST         | List / create supplier orders         | Staff+ |
| `/api/admin/supplier-orders/[id]`          | GET, PATCH, DELETE | Get / update / delete supplier order | Staff+ |
| `/api/admin/users`                         | GET, POST         | List / create staff users             | Owner/Admin |
| `/api/admin/users/[id]`                    | PUT, DELETE       | Update / deactivate staff user        | Owner/Admin |
| `/api/admin/expenses`                      | GET, POST         | List / create expenses                | Owner/Admin |
| `/api/admin/expenses/[id]`                 | DELETE           | Delete expense                        | Owner/Admin |
| `/api/admin/finance`                       | GET              | Finance stats                         | Owner/Admin |
| `/api/upload`                              | POST             | File upload (general)                 | Staff+ |

**Notes**
- `GET /api/admin/products?include=variants` returns full products with variants for supplier-order creation.
- `GET /api/admin/suppliers?status=active` returns only active suppliers for selection.

## 3. Server Actions (Non-HTTP)

Some create/update flows are implemented as **Server Actions** (Next.js `use server`) and therefore **do not have a public URL**. They are invoked from forms or client components and should be treated as internal mutations (see [[Overview]]).
