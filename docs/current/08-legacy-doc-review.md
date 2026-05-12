# Legacy Doc Review

This file records the May 2026 review of remaining legacy docs. It is an audit log, not a source of product truth.

Use this file before deleting, archiving, or migrating old docs. If a rule is listed as unclear, confirm it before copying it into active docs or tests.

## Current Source Of Truth

- Agent-facing docs: `docs/current/**`
- User-facing guide: `docs/guide/**`
- Generated guide output and dependencies: `docs/guide/out`, `docs/guide/node_modules`

`docs/guide/` must be kept and updated in parallel with durable business-rule changes. Do not treat it as disposable legacy content.

## Retired Legacy Docs

Removed in the current cleanup pass after review:

- `docs/035-QA/Reports/QA-Review-2026-04-09.md` - April QA snapshot; conflicts with current May cleanup.
- `docs/035-QA/Test-Cases/TC-SEC-*.md` - broad security cases deferred until a current route matrix and threat model exist.
- `docs/035-QA/Test-Cases/TC-AUTH-007.md` - rate-limit/lockout behavior is not current documented behavior.
- `docs/035-QA/QA-MOC.md` - legacy QA map of content superseded by `docs/current` and focused backlog docs.
- Legacy MOC placeholders removed:
  - `docs/010-Planning/Planning-MOC.md`
  - `docs/020-Requirements/Requirements-MOC.md`
  - `docs/022-User-Stories/Stories-MOC.md`
  - `docs/030-Specs/Specs-MOC.md`
  - `docs/040-Design/Design-MOC.md`
  - `docs/050-Research/Research-MOC.md`
  - `docs/060-Manuals/Manuals-MOC.md`
- Old MVP planning/timeline docs removed:
  - `docs/010-Planning/OKRs.md`
  - `docs/010-Planning/Roadmap.md`
  - `docs/010-Planning/Sprints/Sprint-001.md`

## Safe Retire Candidates After Confirmation

These look stale or historical, but still require explicit deletion/archive confirmation:

- Completed bug-fix plans:
  - `plans/260503-1025-main-medium-bug-fixes/`
  - `plans/260503-1058-admin-bug-fixes/`
- Obvious local metadata:
  - `plans/.DS_Store`
  - nested `.obsidian` folders under exported plan/test-case folders

## Do Not Delete Yet

These still contain useful business logic, test intent, or unresolved policy conflicts:

- `docs/admin-user-stories.md`
- `docs/admin-test-cases.md`
- `docs/035-QA/Test-Cases/*.md` outside confirmed-retired security docs
- `docs/035-QA/Test-Plans/MTP-Phase1.md`
- `docs/035-QA/Test-Plans/Strategy.md`
- `plans/260512-0214-admin-user-story-tc/**`
- `plans/260512-0235-sapo-reports-expansion/**`
- `plans/reports/**` as a broad folder
- `docs/superpowers/**` as a broad folder
- `plans/templates/**`
- `plans/README.md`

Do not delete broad folders just because some files inside are historical. Review by file or narrowly scoped batch.

## Useful Test Intent To Migrate First

The legacy QA docs contain test ideas that may still be useful after rewriting expected behavior:

- `TC-ORD-028` full order lifecycle.
- `TC-CUST-011` customer profile edit.
- `TC-CUST-012` customer reactivation cycle.
- `TC-CHAT-013` attachment upload baseline.
- `TC-CHAT-014` guest session expiry and re-identification.
- `TC-ACC-015` COGS accuracy.
- `TC-PAY-011` payment on cancelled order rejected.
- `TC-PAY-012` card payment method coverage.
- `TC-DASH-012` dashboard KPI exact delta.
- `TC-FIN-003` finance filter changes displayed data.
- `TC-A11Y-001` storefront accessibility scan.
- `TC-STORE-005` inactive product hidden from storefront.
- `TC-CATALOG-007` product sort order.
- `TC-EXP-004` expense edit flow.
- `TC-EXP-005` expense delete flow.

Supplier-order cases `TC-SUP-ORDER-005`, `TC-SUP-ORDER-006`, `TC-SUP-ORDER-017`, `TC-SUP-ORDER-020`, and `TC-SUP-ORDER-021` have useful intent but must not preserve expected `500` behavior.

## Business Logic Still Needing Review

These rules were found in legacy docs but are not confirmed source of truth:

- Legacy customer tier policy conflicts with current code: legacy says OR logic and `Mua nhiều`; current code documents AND logic and `Thường xuyên`.
- Legacy banner position policy conflicts with current code: legacy says `top`, `middle`, `bottom`; current code documents banner type, active dates, and `sortOrder`.
- UX policy: skeleton loading, optimistic rollback, form preservation after server error, mobile sidebar breakpoint.
- Variant selling-price history and changed-by tracking.
- Inactive customer behavior: display-only status vs blocking new orders/login.
- Product image policy: accepted file types, file size, and maximum images.
- Supplier preferred-supplier/reorder relation.
- Expense category list.
- Chat room auto-create when a customer is created.
- Session timeout, same-browser session replacement, and force-change-password after reset.

Confirm these before migrating them into `docs/current/06-business-rules.md` or tests.

## Stale Or Conflicting Claims

Do not copy these from legacy docs without explicit confirmation:

- Order creation immediately deducts stock.
- Order lifecycle uses `paid`, `preparing`, `shipping`, `delivered`, `Confirmed`, or `Delivered` as primary status.
- Cancel order restores inventory in all states.
- Supplier orders are never auto-created from sales-order shortage.
- Customer deletion is deactivate-only.
- Finance reports use delivered date, `orders.total`, `createdAt`, or `paidAt` as the primary realized-sales basis.
- Category delete is blocked when children or products exist.
- API docs use old routes such as `/api/login` or `/products/[slug]`.
- Old RBAC matrix marks settings/analytics as broad staff access.

Current docs say order creation reserves stock, stock-out decrements `onHand`, finance is based on realized stock-out/completed behavior, customer deletion is currently hard delete, and category parent FK behavior leaves children as roots.

## User Guide Sync Gaps

`docs/guide/` is retained, but it needs a dedicated sync pass:

Synced in the current pass:

- `owner/permissions.mdx`, `manager/introduction.mdx`, and `staff/introduction.mdx` now describe `/homepage` as visible to all internal roles, matching the current sidebar.
- `owner|manager|staff/customers.mdx` now describe customer tiers as AND-based thresholds under `/settings`, matching current code.
- `owner|manager/products.mdx` now describes product image upload as UI `image/*` with a 10-image variant limit.
- `owner|manager|staff/orders.mdx` now describe reservation-at-create, stock-out inventory deduction, and pending-only cancellation in the normal UI flow.
- `owner|manager|staff/inventory.mdx` now describe `reserved` vs `onHand` correctly for create, stock-out, cancellation, and receipt completion.
- `owner|manager/purchases.mdx` now include partial PO receipt state and cancellation before fully received.
- `owner|manager/receipts.mdx` now scope the full-payment-before-complete rule to the current UI gate.
- `owner/finance.mdx`, `owner|manager/analytics.mdx`, and `owner|manager|staff/dashboard.mdx` now separate official P&L formulas from operational dashboard formulas.

Remaining open gaps:

- `docs/guide/docs.json` appears newer than `docs/guide/mint.json`, but both should be kept until deployment config is confirmed.
- `docs.json` omits existing pages:
  - `owner/purchases`
  - `owner/receipts`
  - `owner/payouts`
  - `manager/purchases`
  - `manager/receipts`
  - `manager/payouts`
- `mint.json` omits newer pages such as `debts`, `homepage`, `inventory`, and `supplier-orders`.
- `supplier-orders.mdx` pages blur legacy supplier orders with the newer purchase/receipt/payout flow.
- `customers.mdx` still mentions inactive customer blocking from storefront login; confirm exact customer-session behavior before turning this into a test requirement.
- `chat.mdx` describes AI auto-reply as configured behavior; current docs mark it as a policy gap.
- `suppliers.mdx` says supplier deletion is blocked by existing orders; current rules describe soft deletion.

Recommended guide update order:

1. Confirm active Mintlify config and sync navigation.
2. Update debts guide pages after confirming customer-debt report policy.
3. Confirm role matrix for homepage/settings/content/widgets.
4. Normalize supplier-order vs purchase/receipt/payout naming.
5. Update CRM inactive-customer wording, chat, and suppliers after confirmation.

## Questions Before Next Delete Batch

Ask before deleting or migrating:

1. Should `admin-user-stories.md` and `admin-test-cases.md` be archived as history after selected rules are migrated, or deleted outright?
2. Should customer tiers keep the current AND logic and labels, or should legacy OR logic and `Mua nhiều` label replace them?
3. Should inactive customers be blocked from new orders/login, or only shown as inactive?
4. Should the app support variant selling-price history, or only cost history?
5. Should product image type/size/max-image limits be formalized?
6. Can legacy claims about old order statuses, delivered-date finance, immediate stock deduction, and old RBAC matrix be retired?
