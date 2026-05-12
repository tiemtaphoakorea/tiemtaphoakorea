# Storefront App

## Purpose

`apps/main` is the public storefront and customer-facing app.

## Primary Routes

Storefront pages live under `apps/main/app/(store)`:

- `/`
- `/product`
- `/product/[slug]`
- `/account`
- `/account/orders`
- `/account/chat`
- `/account/wishlist`
- `/order-lookup`
- `/about`
- `/contact`
- `/shipping`
- `/returns`
- `/privacy`
- `/terms`

Storefront APIs live under `apps/main/app/api`.

## Key Code

| Area | Path |
| --- | --- |
| Product APIs | `apps/main/app/api/products/route.ts` |
| Category APIs | `apps/main/app/api/categories/route.ts` |
| Chat APIs | `apps/main/app/api/chat` |
| Upload API | `apps/main/app/api/upload/route.ts` |
| Product service | `packages/database/src/services/product.server.ts` |
| Category service | `packages/database/src/services/category.server.ts` |
| Guest/customer service | `packages/database/src/services/guest.server.ts` |
| Chat service | `packages/database/src/services/chat.server.ts` |

## Business Rules

- Public product listings should expose active products only.
- Category filtering should include descendant categories when the product service supports it.
- Product sort/filter behavior should come from service/API behavior, not client-only assumptions.
- Public homepage product sections are resolved from active admin-managed collections.
- Active homepage collections with zero resolved active products are hidden.
- Availability should distinguish available, out-of-stock, and preorder states, but exact labels need confirmation before strict tests.
- Storefront customer identity is separate from internal admin identity.
- Guest identity uses the shared guest prefix when guest records are created.

See `docs/current/modules/catalog-homepage.md`, `docs/current/modules/crm-chat.md`, and `docs/current/06-business-rules.md` for the complete current rule map.

## Test Guidance

Storefront E2E tests should create or locate deterministic products and assert visible product data. Avoid tests that silently pass when optional controls are missing.
