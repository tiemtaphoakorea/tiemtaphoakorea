# Agent Map

Use this file to choose the smallest useful reading set before making changes.

## Read Order

For any task:

1. Read `docs/current/README.md`.
2. Read the relevant row in this file.
3. If behavior, tests, or reports are involved, read `docs/current/06-business-rules.md`.
4. Read the linked module doc.
5. Read code before editing.

## Task Routing

| Task | Read | Then inspect |
| --- | --- | --- |
| Admin page or API change | `modules/admin.md` | `apps/admin/app`, `apps/admin/components`, `apps/admin/services` |
| Product, category, homepage collection | `modules/catalog-homepage.md` | `packages/database/src/services/product.server.ts`, `category.server.ts`, `homepage-collection.server.ts` |
| Customers, guests, chat | `modules/crm-chat.md` | `customer.server.ts`, `guest.server.ts`, `chat.server.ts`, profile/chat schemas |
| Storefront page or API change | `modules/storefront.md` | `apps/main/app`, `apps/main/components`, `apps/main/services` |
| Auth, roles, sessions | `modules/auth-rbac.md` | `apps/admin/lib/api-auth.ts`, `packages/database/src/lib/auth.ts`, `packages/database/src/lib/security.ts` |
| Orders, inventory, purchases, receipts | `modules/orders-inventory.md` | `packages/database/src/services/order.server.ts`, inventory, purchase, receipt services |
| Finance, analytics, reports | `modules/reports-finance.md` | `packages/database/src/services/report*.server.ts`, `finance.server.ts`, `analytics.server.ts` |
| Business logic or domain invariants | `06-business-rules.md` | Owning service in `packages/database/src/services` and schema in `packages/database/src/schema` |
| Tests | `03-testing.md` | `tests/unit`, `tests/integration`, `tests/e2e` |
| Test cleanup | `05-test-cleanup-backlog.md` | Targeted test file, then the implementation it claims to cover |
| Documentation cleanup | `04-docs-migration.md`, `08-legacy-doc-review.md` | `docs/current`, then legacy docs only if needed |
| Legacy business-rule migration | `07-business-rule-migration-log.md` | Legacy source doc, owning service, then `06-business-rules.md` |

## User Guide Docs

`docs/guide/` is the user-facing guide, not disposable legacy documentation. When `docs/current/` changes a durable workflow or business rule, update the matching guide page in parallel.

## Do Not Start Here

These paths are legacy or generated and should not be the first source of truth:

- `docs/010-Planning` through `docs/999-Resources`
- `docs/035-QA/Test-Cases`
- `docs/superpowers`
- `plans`
- `docs/guide/out`
- `docs/guide/node_modules`
- `docs/.obsidian`

They can be useful for history, but they are not the active docs structure.

## Current Runtime Defaults

- Main storefront: `http://localhost:3000`
- Admin dashboard: `http://localhost:3001`

## Confirmation Rule

If behavior is unclear, missing from `docs/current`, or appears to come from dead code/old code, ask for confirmation before rewriting tests, deleting files, or changing product behavior.
