---
id: SDD-AuthShopPlatform
type: sdd
status: draft
project: Auth Shop Platform
created: 2026-01-19
linked-to: [[PRD-AuthShopPlatform]]
---

# System Design Document: Auth Shop Platform

## 1. System Context

The **Auth Shop Platform** is a monolithic web application built on the **Next.js (App Router)** full-stack framework, utilizing **Supabase** as a Backend-as-a-Service (BaaS) for Database, Auth, Storage, and Realtime features.

### Actors

- **Admin (Owner/Manager/Staff)**: Managing the shop via the dashboard.
- **Customer**: Browsing products and chatting with support.

## 2. Technology Stack

| Component      | Technology               | Reasoning                                                                           |
| :------------- | :----------------------- | :---------------------------------------------------------------------------------- |
| **Framework**  | Next.js (App Router)     | Server Components + Route Handlers for data fetching and mutations. |
| **Language**   | TypeScript               | Type safety for reliable development.                                               |
| **Database**   | PostgreSQL (Supabase)    | Relational data integrity, powerful SQL, and built-in extensions.                   |
| **Auth**       | Supabase Auth            | Secure, built-in user management with Social/Email providers.                       |
| **Storage**    | Supabase Storage         | S3-compatible object storage for product images and chat attachments.               |
| **Realtime**   | Supabase Realtime        | Websockets for Instant Chat features.                                               |
| **Styling**    | Tailwind CSS + shadcn/ui | Rapid UI development with accessible, customizable components.                      |
| **Deployment** | Vercel                   | Optimized edge/serverless deployment for Next.js.                                   |

## 3. High-Level Architecture

```mermaid
graph TD
    User[User (Client)]
    Vercel[Vercel (Next.js App)]
    Supabase[Supabase Platform]

    User -->|HTTPS| Vercel
    Vercel -->|SQL/API| Supabase
    User -->|WebSockets| Supabase

    subgraph Supabase
        DB[(PostgreSQL)]
        Auth[GoTrue]
        Storage[Storage API]
        Realtime[Realtime Engine]
    end
```

## 4. Key Architectural Patterns

### 4.1 Data Loading & Mutation

- **Server Components**: Server-side data fetching. Runs on the server (or Edge), talks directly to Supabase via `supabase-js` (Service Role or Authenticated Client).
- **Route Handlers**: HTTP endpoints under `app/api/*` for JSON access.
- **Server Actions**: Next.js `use server` mutations invoked from forms/components (internal-only, no public URL).
- **Optimistic UI**: Client components handle optimistic updates where needed.

### 4.2 Security & Permissions

- **Authentication**: JWT-based via Supabase Auth.
- **Authorization**:
  - **Frontend**: UX hiding based on user role (Owner/Manager/Staff).
  - **Backend (RLS)**: **CRITICAL**. Postgres Row Level Security policies enforce the actual Data Access rules.
    - `auth.uid() = user_id` for personal data.
    - Role checks via a `profiles` or `user_roles` table.

### 4.3 Database Schema (Preliminary)

- **profiles**: Extended user data (role: text).
- **products**: Product core info.
- **variants**: SKU, Stock, Pricing (Relationship -> products).
- **orders**: Head info, customer_id, status.
- **order_items**: Link order -> variant, quantity, price_at_purchase.
- **payments**: Link -> orders.
- **conversations/messages**: Chat history.

## 5. Deployment View

- **Vercel**: Hosts the Next.js application.
- **Environment Variables**:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Server only!)

## 6. Future Considerations

- **Search**: For larger catalogs, consider full-text search engines (e.g., Meilisearch) if Postgres FTS becomes insufficient.
- **Caching**: Implement HTTP caching headers in Next.js route handlers for public pages (e.g., Customer Catalog).
