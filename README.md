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

- **Framework**: React Router v7 (Vite)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS & Shadcn UI
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Project

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
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
npm install
```

### Database Setup

Run migrations to set up the schema:

```bash
npm run db:migrate
```

(Optional) Seed initial data:

```bash
npm run db:seed
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to browse the store.
Visit `http://localhost:5173/admin` to access the management dashboard.

## Deployment

Build for production:

```bash
npm run build
```

Deploy to Vercel or any Node.js hosting provider.
