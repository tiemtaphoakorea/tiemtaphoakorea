# Current Docs

This folder is the active documentation set for agents and maintainers.

Read this first:

1. `00-agent-map.md` - where to look before editing.
2. `01-system-overview.md` - repo shape, apps, packages, domains.
3. `06-business-rules.md` - business logic and invariants to preserve.
4. `02-development-workflow.md` - local commands, environment, database workflow.
5. `03-testing.md` - test structure, verification policy, cleanup rules.
6. `04-docs-migration.md` - how the old docs will be retired gradually.
7. `05-test-cleanup-backlog.md` - prioritized test cleanup queue.
8. `07-business-rule-migration-log.md` - migrated, stale, and needs-confirmation legacy rules.
9. `08-legacy-doc-review.md` - remaining legacy-doc audit and deletion-confirmation queue.

Module docs:

- `modules/auth-rbac.md`
- `modules/admin.md`
- `modules/catalog-homepage.md`
- `modules/crm-chat.md`
- `modules/storefront.md`
- `modules/orders-inventory.md`
- `modules/reports-finance.md`

Review docs:

- `08-legacy-doc-review.md`

Templates:

- `templates/module-doc-template.md`

## Rule For Agents

Use `docs/current/` as the source of truth. For behavior changes, read `06-business-rules.md` before editing tests or services. Only open older docs when a current doc links to them or when you need historical context.

## When To Ask

Ask and confirm before changing or deleting code/docs when:

- The expected behavior is not described in `docs/current`.
- Current docs and source code appear to disagree.
- A file, test, route, or helper looks like dead code or old code but is not already listed for cleanup.
- A test looks redundant but no stronger replacement is documented.
- The change would decide a product policy that is only implied by the current implementation.
