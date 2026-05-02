# Analytics Index Page Redesign — Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to run phase-by-phase. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace 6-card analytics index có data trùng → 4 mini-viz cards 1-1 với sub-pages.

**Architecture:** Mỗi card 1 mini-viz độc đáo (donut / line+margin / top3 list / alert). Tất cả real API. Sub-components để tách responsibility.

**Tech Stack:** Next.js 15 · React 19 · recharts ^2.15 · TanStack Query · Drizzle · Tailwind.

**Spec:** [`design.md`](./design.md)

---

## File Map

### Modify
- `packages/database/src/services/analytics.server.ts` — `categorySales` query thêm `revenue`
- `packages/database/src/types/admin.ts` — `AnalyticsCategorySale` thêm `revenue: number`
- `apps/admin/app/(dashboard)/analytics/_content.tsx` — rewrite 6 cards → 4 cards

### Create
- `apps/admin/components/admin/analytics/index-card-revenue-mix.tsx`
- `apps/admin/components/admin/analytics/index-card-finance-trend.tsx`
- `apps/admin/components/admin/analytics/index-card-top-products.tsx`
- `apps/admin/components/admin/analytics/index-card-stock-alert.tsx`

### Delete
- `apps/admin/components/admin/analytics/analytics-hub-cards.tsx` (orphan, không có reference)

---

## Verification commands

- Typecheck admin: `pnpm --filter @workspace/admin typecheck`
- Lint admin: `pnpm --filter @workspace/admin lint`
- Manual visual: `pnpm --filter @workspace/admin dev` → mở `http://localhost:3001/analytics`

---

## Phases

- [x] [Phase 1](./phase-01-extend-category-sales-revenue.md) — Backend: extend `categorySales` với `revenue`
- [x] [Phase 2](./phase-02-card-revenue-mix-donut.md) — Card 1: donut cơ cấu doanh thu
- [x] [Phase 3](./phase-03-card-finance-trend-line.md) — Card 2: line 30 ngày + margin
- [x] [Phase 4](./phase-04-card-top-products.md) — Card 3: top 3 SP
- [x] [Phase 5](./phase-05-card-stock-alert.md) — Card 4: cảnh báo tồn kho
- [x] [Phase 6](./phase-06-integrate-and-cleanup.md) — Tích hợp `_content.tsx` + cleanup

Mỗi phase end với 1 commit (conventional). Phase 6 chạy typecheck/lint/visual đầy đủ trước commit.
