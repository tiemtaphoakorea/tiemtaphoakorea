# System Overview

Auth Shop Platform is a pnpm workspace for a shop management system.

## Apps

| App | Path | Purpose | Local URL |
| --- | --- | --- | --- |
| Admin | `apps/admin` | Internal dashboard, admin APIs, operations | `http://localhost:3001` |
| Main | `apps/main` | Public storefront, customer account pages, chat | `http://localhost:3000` |

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| Database | `packages/database` | Drizzle schema, server services, auth helpers |
| Shared | `packages/shared` | Constants, schemas, route/API helpers, types |
| UI | `packages/ui` | Shared shadcn-based components |

## Main Domains

- Auth and RBAC: owner, manager, staff, customer roles.
- Product catalog: products, categories, variants, media, stock settings.
- Homepage content: banners, admin-managed product collections, storefront sections.
- Orders: order creation, payment tracking, fulfillment, cancellation.
- Inventory: stock movements, goods receipts, purchases, supplier orders.
- CRM: customers, suppliers, debts, chat.
- Finance and reports: expenses, payouts, profit/loss, cash flow, debt reports, analytics.
- Storefront: product listing/detail, account pages, order lookup, support chat.

Read `06-business-rules.md` before changing domain behavior or tests. The module docs below locate code; the business rules doc explains the behavior that should be preserved.

## Code Ownership Map

| Domain | Primary code |
| --- | --- |
| Admin routes | `apps/admin/app/(dashboard)` |
| Admin API routes | `apps/admin/app/api/admin` |
| Admin client calls | `apps/admin/services` |
| Storefront routes | `apps/main/app/(store)` |
| Storefront APIs | `apps/main/app/api` |
| Business logic | `packages/database/src/services` |
| DB schema | `packages/database/src/schema` |
| Form schemas | `packages/shared/src/schemas` |
| Shared constants | `packages/shared/src/constants.ts` |
| UI primitives | `packages/ui/src/components` |
| Legacy migration status | `docs/current/07-business-rule-migration-log.md` |

## Design Rule

Use existing UI primitives before custom markup. Start with `packages/ui/src/components` and compose local admin/shared components where available.
