# Admin App

## Purpose

`apps/admin` is the internal operations dashboard. It owns admin UI pages and admin API route handlers.

## Primary Routes

Admin pages live under `apps/admin/app/(dashboard)`:

- `/` dashboard
- `/products`, `/products/new`
- `/categories`
- `/orders`, `/orders/new`, `/orders/[id]`
- `/customers`, `/customers/[id]`
- `/suppliers`
- `/supplier-orders`
- `/purchases`, `/purchases/new`, `/purchases/[id]`
- `/receipts`, `/receipts/new`, `/receipts/[id]`
- `/payouts`
- `/expenses`
- `/debts`, `/debts/[customerId]`
- `/inventory`
- `/analytics/*`
- `/reports/*`
- `/chat`
- `/users`
- `/settings`
- `/homepage`, `/content`, `/widgets`

Admin APIs live under `apps/admin/app/api/admin`.

## Client/Data Pattern

- Client calls are centralized in `apps/admin/services/admin.client.ts` and adjacent service files.
- Server business logic should usually live in `packages/database/src/services`.
- Shared form validation should use `packages/shared/src/schemas`.
- Shared UI should come from `packages/ui/src/components` first.

## Business Rule Ownership

Admin pages are workflow surfaces. They should call service/API behavior rather than reimplementing domain rules in component state.

- Order, payment, stock-out, cancellation, return, and debt rules live in order/inventory services.
- Purchase, receipt, supplier payment, and weighted-average-cost rules live in purchase/receipt/payment services.
- Finance totals and report inclusion rules live in finance/report services.
- Product slug, SKU, variant cost, and active listing rules live in product/category services.
- Homepage collection rules live in `homepage-collection.server.ts`.
- Customer phone uniqueness and profile behavior live in customer/user services.
- Chat room/message/unread rules live in `chat.server.ts`.

Read `docs/current/06-business-rules.md` before changing admin tests that assert business behavior.

## Role Navigation

- `users`, `expenses`, `settings`, `content`, and `widgets` are hidden from non-owner roles in the current sidebar.
- `analytics` is visible to owner and manager.
- `reports` is owner-only in the current sidebar.
- `homepage` is currently visible to all internal roles.
- Sidebar visibility is not enough to define API authorization. Check route handlers before adding direct URL or API tests.

## Global Search

- Header global search is desktop-only.
- It starts at 2+ characters, debounced by 300ms.
- It queries products, orders, and customers in parallel with `limit=4` each.
- Result targets are product edit, order detail, and customer detail pages.
- Keyboard navigation supports arrow keys, Enter, and Escape.

## Test Guidance

Prefer API-backed setup through `tests/e2e/helpers/api.ts` and deterministic data names with a run id. UI tests should assert actual saved state, not only navigation or URL changes.
