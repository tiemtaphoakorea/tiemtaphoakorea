---
id: SPEC-019
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec, infrastructure]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-30
updated: 2026-01-30
---

# Spec: Infrastructure & Setup

## Related Epics

- [[Epic-01-Infrastructure]]

---

## 1. Overview

### 1.1 Purpose

This specification defines the technical infrastructure and setup requirements for Auth Shop Platform. It covers the technology stack, deployment architecture, and foundational configurations.

### 1.2 Scope

- Technology stack selection and setup
- Project structure and directory organization
- Database schema design principles
- Deployment pipeline and hosting
- Environment configuration

---

## 2. Technology Stack

### 2.1 Frontend

| Technology     | Version | Purpose                              |
| -------------- | ------- | ------------------------------------ |
| Next.js        | 15.x    | React framework with App Router      |
| React          | 19.x    | UI library                           |
| TypeScript     | 5.x     | Type-safe JavaScript                 |
| Tailwind CSS   | 3.x     | Utility-first CSS framework          |
| Shadcn/ui      | Latest  | Radix-based UI components            |

### 2.2 Backend & Database

| Technology     | Version | Purpose                              |
| -------------- | ------- | ------------------------------------ |
| Supabase       | Latest  | PostgreSQL database, Auth, Storage   |
| Drizzle ORM    | Latest  | Type-safe database queries           |
| PostgreSQL     | 15.x    | Relational database (via Supabase)   |

### 2.3 Deployment

| Technology     | Purpose                              |
| -------------- | ------------------------------------ |
| Vercel         | Frontend hosting and serverless      |
| Supabase Cloud | Database and backend services        |

---

## 3. Project Structure

```
auth_shop_platform/
├── app/                    # Next.js App Router
│   ├── (store)/           # Public store pages (catalog)
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   ├── admin/            # Admin-specific components
│   └── store/            # Store-specific components
├── db/                    # Database layer
│   ├── schema/           # Drizzle schema definitions
│   └── index.ts          # Database client
├── lib/                   # Utility functions
│   ├── auth.server.ts    # Authentication utilities
│   ├── supabase/          # Supabase clients (server/client)
│   └── utils.ts          # General utilities
├── services/              # Business logic layer
│   ├── product.server.ts
│   ├── order.server.ts
│   └── ...
├── hooks/                 # React hooks
├── types/                 # TypeScript type definitions
├── tests/                 # Test files
│   ├── e2e/              # End-to-end tests (Playwright)
│   ├── unit/             # Unit tests (Vitest)
│   └── security/         # Security tests
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── public/               # Static assets
```

---

## 4. Database Architecture

### 4.1 Schema Design Principles

- **UUID Primary Keys**: All tables use UUID for primary keys
- **Timestamps**: `created_at` and `updated_at` on all tables
- **Soft Deletes**: Use `status` field instead of hard deletes where appropriate
- **Audit Trail**: Status history tables for critical entities (orders)

### 4.2 Core Tables

| Table              | Purpose                              |
| ------------------ | ------------------------------------ |
| `profiles`         | Users (admin, staff, customers)      |
| `categories`       | Product categories                   |
| `products`         | Main product information             |
| `product_variants` | Product variations (size, color)     |
| `orders`           | Order headers                        |
| `order_items`      | Order line items                     |
| `suppliers`        | Product suppliers                    |
| `supplier_orders`  | Orders to suppliers (pre-order)      |
| `expenses`         | Operational expenses                 |
| `chat_rooms`       | Chat conversations                   |
| `chat_messages`    | Chat messages                        |

### 4.3 Row Level Security (RLS)

All tables must have RLS policies:
- Admin tables: Restricted to authenticated admin users
- Customer data: Restricted by customer_id
- Public data: Read-only for anonymous users (catalog)

---

## 5. Environment Configuration

### 5.1 Required Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Direct connection for Drizzle)
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your-jwt-secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5.2 Environment Files

| File           | Purpose                              |
| -------------- | ------------------------------------ |
| `.env.local`   | Local development (gitignored)       |
| `.env.example` | Template with placeholder values     |
| `.env.test`    | Test environment                     |

---

## 6. Deployment Pipeline

### 6.1 Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 6.2 CI/CD Workflow

1. **Push to main**: Triggers production deployment
2. **Pull Request**: Creates preview deployment
3. **Pre-deploy checks**:
   - TypeScript compilation
   - Linting (ESLint)
   - Unit tests (Vitest)
   - E2E tests (Playwright) on preview

### 6.3 Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema (development)
npm run db:push
```

---

## 7. Security Configuration

### 7.1 Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];
```

### 7.2 CORS

Configured via Supabase dashboard for API access control.

### 7.3 Rate Limiting

- Login attempts: 5 per minute per IP
- API requests: 100 per minute per user

---

## 8. Monitoring & Logging

### 8.1 Error Tracking

- Vercel Analytics for frontend errors
- Supabase logs for database queries

### 8.2 Performance Monitoring

- Vercel Speed Insights
- Core Web Vitals tracking

---

## 9. Development Setup

### 9.1 Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Git

### 9.2 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd auth_shop_platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### 9.3 Available Scripts

| Script           | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start development server             |
| `npm run build`  | Build production bundle              |
| `npm run start`  | Start production server              |
| `npm run lint`   | Run ESLint                           |
| `npm run test`   | Run unit tests                       |
| `npm run test:e2e` | Run E2E tests                      |
| `npm run db:generate` | Generate Drizzle migration      |
| `npm run db:push` | Push schema to database             |

---

## 10. Related Documents

- [[PRD-AuthShopPlatform]] - Product requirements
- [[SDD-AuthShopPlatform]] - System design document
- [[Spec-Authentication-Authorization]] - Auth implementation

---

## 11. Revision History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | 2026-01-30 | Claude | Initial version |
