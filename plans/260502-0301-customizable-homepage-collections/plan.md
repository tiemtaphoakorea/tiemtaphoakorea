# Customizable Homepage Collections — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 3 hardcoded homepage product sections (Bán chạy / Hàng mới / Featured) with admin-managed collections supporting 4 types: `manual`, `best_sellers`, `new_arrivals`, `by_category`. Admin can create, edit, drag-reorder, and toggle isActive per collection; manual collections support drag-reorder of products.

**Architecture:** Two new tables (`homepage_collections` + `homepage_collection_products` junction). Public service `getActiveHomepageCollections` resolves each by type — reuses existing `getBestSellers` / `getNewArrivals`, adds `getProductsByCategory` and manual junction join. Storefront page replaces 3 fixed sections with single dynamic loop rendering generic `<HomepageCollection>` component. Admin gets new `/dashboard/homepage` route with dnd-kit list + form + product picker.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL, TanStack Query, shadcn/ui, `@dnd-kit/core` + `@dnd-kit/sortable` (new dep), Vitest.

**Spec:** `docs/superpowers/specs/2026-05-02-customizable-homepage-collections-design.md`

---

## Phases

| # | Phase | File | Status |
|---|---|---|---|
| 1 | Database schema + service layer | [phase-01-schema-and-services.md](./phase-01-schema-and-services.md) | pending |
| 2 | Public storefront refactor | [phase-02-public-storefront.md](./phase-02-public-storefront.md) | pending |
| 3 | Admin API routes + client methods | [phase-03-admin-api.md](./phase-03-admin-api.md) | pending |
| 4 | Admin UI (list, form, picker, nav) | [phase-04-admin-ui.md](./phase-04-admin-ui.md) | pending |

## Dependencies

- Phase 1 → Phase 2 (storefront depends on service layer)
- Phase 1 → Phase 3 (API routes depend on service layer)
- Phase 3 → Phase 4 (UI depends on API + admin client methods)
- Phase 2 và Phase 3 có thể chạy song song sau khi xong Phase 1

## Out of Scope (YAGNI)

- Schedule (`startsAt` / `endsAt`)
- Visibility per breakpoint (mobile/desktop)
- Auto-rule khác ngoài 3 loại nêu trên
- A/B testing, personalization
- Cache tag invalidation (homepage đã `force-dynamic`)

## Open Questions

- Liệu `getFeaturedProducts` còn dùng ở đâu khác ngoài homepage? → Phase 2 sẽ grep và quyết định giữ/bỏ.
- Pattern product picker có sẵn trong admin (orders/?) hay phải tự làm? → Phase 4 sẽ kiểm tra `apps/admin/app/(dashboard)/orders/`.
