# Auth Shop Platform

An internal shop management system for Phase 1 (MVP). Documentation lives in `docs/` and is the source of truth.

## Overview

This platform manages the entire lifecycle of an e-commerce operation, from product management and inventory to order fulfillment, finance tracking, and customer support.

## Scope (Phase 1 - MVP)

- Authentication & RBAC for Owners, Managers, and Staff
- Product catalog, variants, inventory, and pricing history
- Public customer catalog with product detail views
- Order management and supplier order workflows
- Customer and supplier management
- Payments, expenses, and P&L reporting
- Dashboard KPIs and analytics widgets
- Real-time chat and support inbox
- Store settings (shipping, payment, notifications)

## Documentation

Entry point: `docs/000-Index.md`

Current active docs:

- QA map, test plans, and test cases: `docs/035-QA/QA-MOC.md`
- Research map: `docs/050-Research/Research-MOC.md`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Monorepo**: pnpm workspaces + Turborepo
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS & Shadcn UI
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm 9.15.9+
- Supabase Project

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL` (Transaction connection pooler)

Optional AI Agent variables (auto-reply customer chat):

- `AI_AGENT_ENABLED=true` (default: enabled)
- `AI_AGENT_USERNAME` (default: `ai_agent_bot`, bot profile riêng của agent)
- `AI_AGENT_DISPLAY_NAME` (default: `AI Agent`)
- `AI_AGENT_PROFILE_ID` (optional override nếu muốn dùng 1 internal profile có sẵn)
- `OPENAI_API_KEY=<openai_api_key>`
- `AI_AGENT_MODEL` (default: `gpt-4o-mini`)
- `AI_AGENT_MAX_TURNS` (default: `4`, via OpenAI Agents SDK loop)
- `AI_AGENT_SAFE_MODE` (default: `true`, mask/reduce sensitive data before sending to model)
- `AI_AGENT_SYSTEM_PROMPT` (optional inline prompt override, highest priority)
- `AI_AGENT_SYSTEM_PROMPT_FILE` (default: `agent/prompts/system-prompt.vi.md`)
- `AI_AGENT_PRODUCT_TOOL_RULES_FILE` (default: `agent/prompts/product-tool-rules.vi.md`)

### Installation

```bash
pnpm install
```

### Database Setup

Lần đầu setup DB (schema chưa có):

```bash
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:migrate
```

Nếu DB đã có schema sẵn (legacy/prod đã chạy migration thủ công) nhưng chưa có tracking table, chạy 1 lần:

```bash
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:mark-baseline
```

(Optional) Seed dữ liệu cho môi trường e2e:

```bash
pnpm db:seed:e2e
```

### Migration Workflow

Drizzle migrations nằm ở `packages/database/drizzle/`. Trạng thái DB được track qua bảng `drizzle.__drizzle_migrations` (chỉ chứa hash các migration đã chạy — không đụng đến dữ liệu `public.*`).

**Commands** (chạy từ repo root):

```bash
# 1) Sinh migration SQL mới từ schema change
pnpm --filter @workspace/database db:generate

# 2) Áp migration lên DB trỏ bởi $DATABASE_URL
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:migrate

# 3) Check DB đã up-to-date với local migration files chưa (read-only)
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:status

# 4) One-time: mark DB hiện có là "đã apply" baseline (dùng khi rebaseline, hoặc
#    khi gắn tracking vào DB legacy đã có schema nhưng chưa có tracking table).
#    Idempotent — từ chối chạy nếu tracking table đã có row.
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:mark-baseline
```

**Build gate**: `apps/admin` và `apps/main` chạy `db:status` trước `next build`. Vercel build sẽ fail sớm nếu DB trỏ bởi `$DATABASE_URL` còn migration pending — tránh deploy code không khớp schema.

**Flow khi có schema change mới**:

1. Sửa `packages/database/src/schema/*.ts`
2. `pnpm --filter @workspace/database db:generate` → commit file `.sql` + `meta/*.json`
3. Trước deploy: chạy `db:migrate` 1 lần trên prod DB
4. Push code → Vercel build chạy `db:status` → pass

Quên bước 3 → build fail ở bước `db:status`, không deploy.

### Development

Start both apps cùng lúc (via Turborepo):

```bash
pnpm dev
```

- Main (customer store): `http://localhost:3000`
- Admin (management dashboard): `http://localhost:3001`

Hoặc chạy riêng từng app:

```bash
pnpm --filter @workspace/main dev
pnpm --filter @workspace/admin dev
```

## Deployment

Build for production:

```bash
pnpm build
```

Deploy lên Vercel (mỗi app deploy riêng). Build sẽ chạy `db:status` trước `next build` và fail nếu DB còn migration pending.
