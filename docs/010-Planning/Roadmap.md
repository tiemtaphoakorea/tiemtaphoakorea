---
id: PLAN-Roadmap
type: roadmap
status: active
project: Auth Shop Platform
created: 2026-01-19
linked-to: [[PRD-AuthShopPlatform]]
---

# Project Roadmap: Auth Shop Platform (MVP)

**Timeline**: 4 Weeks (20 Working Days)
**Total Effort Estimate**: ~104 Hours

## Week 1: Foundation & Core Data

**Focus**: Infrastructure, Auth, and Basic Product Management.

- **Module 1: Setup & Infrastructure** (12h)
  - [ ] Init Next.js + Directory Structure
  - [ ] Setup Supabase (DB, Auth, Storage, Realtime)
  - [ ] DB Schema Design
  - [ ] UI Setup (Tailwind, Shadcn)
  - [ ] Deploy to Vercel
- **Module 2: Auth & Authorization** (8h)
  - [ ] Admin Login
  - [ ] RBAC (Owner/Manager/Staff)
  - [ ] Password flows
- **Module 3 (Start): Product Management**
  - [ ] CRUD Categories & Products (Basic)

## Week 2: Inventory & Customers

**Focus**: Advanced Product features, Inventory, and Customer facing views.

- **Module 3 (Finish): Product Management** (18h total)
  - [ ] Variants & Cost Prices
  - [ ] Inventory Logic
  - [ ] Image Upload
  - [ ] Search/Filter
- **Module 4: Customer Page** (5h)
  - [ ] Product Catalog & Details (Read-only)
- **Module 5: Customer Management** (3h)
  - [ ] CRUD Customers
  - [ ] Purchase History

## Week 3: Order Operations

**Focus**: The complex core – Order processing, logistics logic, and payments.

- **Module 6: Order Management** (24h)
  - [ ] Create Order (Select User + Products)
  - [ ] Complex Logic (In-stock vs Pre-order splitting)
  - [ ] Order Status Machine (Draft -> Completed/Returned)
  - [ ] Returns & Exchanges
- **Module 7: Payment** (5h)
  - [ ] Partial/Full Payment logic
  - [ ] Payment History tracking

## Week 4: Real-time, Accounting & Analytics

**Focus**: Communication, Financials, and Dashboard.

- **Module 8: Chat Real-time** (13h)
  - [ ] Supabase Realtime Subscriptions
  - [ ] Admin & Customer Chat UI
  - [ ] Image support
- **Module 9: Accounting** (16h)
  - [ ] Cost Price tracking
  - [ ] Expense Management (Fixed/Variable)
  - [ ] Debt & Revenue Reconciliation
- **Module 10: Dashboard** (9h)
  - [ ] Charts (Revenue/Profit)
  - [ ] P&L Reports
  - [ ] Order Suggestions

## Post-MVP

- Advanced Analytics
- Public E-commerce capabilities (Cart/Checkout)
- Mobile App
