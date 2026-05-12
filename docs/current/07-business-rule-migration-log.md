# Business Rule Migration Log

This file tracks legacy business rules reviewed during migration into `docs/current`.

## Migrated In This Pass

| Source | Migrated rule area |
| --- | --- |
| `docs/030-Specs/Spec-Authentication-Authorization.md` | Internal roles, owner-only management/finance areas, login validation |
| `docs/030-Specs/Spec-Product-Management.md` | Variant ownership of SKU/price/cost/stock/images, low-stock threshold concept, cost history intent |
| `docs/030-Specs/Spec-Customer-Catalog.md` | Public catalog active-product visibility and stock availability display rules |
| `docs/030-Specs/Spec-Customer-CRM.md` | Customer profile role, customer type, customer history/debt purpose, customer code intent |
| `docs/030-Specs/Spec-Chat-System.md` | One chat room per customer, message ordering, unread counters, text/image constraints |
| `docs/030-Specs/Spec-Supplier-Management.md` | Supplier code/status/search/stats, soft delete, supplier order status stats |
| `docs/030-Specs/Spec-RBAC-Matrix.md` | Owner-only users/finance/reporting split and internal operational access caveat |
| `docs/022-User-Stories/Backlog/US-2.4-RBAC-Assignment.md` | Last-owner lockout prevention, confirmed by current user service |
| `docs/admin-test-cases.md` | Payment audit row detail, accepted payment methods at API boundary, payment idempotency direction |
| `docs/035-QA/Test-Cases/TC-PAY-004.md` | Payment history should list amount, method, timestamp, and paid amount should derive from accepted payments |
| `docs/035-QA/Test-Cases/TC-SUP-ORDER-005.md` and `TC-SUP-ORDER-006.md` | Legacy supplier order terminal statuses and delete-only-when-cancelled rule, adjusted to current service behavior |
| `docs/035-QA/Test-Cases/TC-SUP-ORDER-022.md` | Legacy supplier order positive-quantity validation |
| `docs/superpowers/specs/2026-05-02-customizable-homepage-collections-design.md` | Homepage collection types, active sorting, empty-section hiding, manual product ordering |
| `plans/reports/Explore-260512-0217-preorder-cogs-flow.md` | Paid pending preorder P&L caveat and stock-out COGS re-snapshot dependency |
| `plans/260512-0214-admin-user-story-tc/test-cases/06-inventory.md` | Opening-stock baseline and movement-chain invariant |
| `docs/admin-user-stories.md` and `docs/admin-test-cases.md` | Current sidebar visibility, global search behavior, customer tier implementation, customer active status, product image upload limits, banner behavior, and expense type taxonomy |

## Not Migrated Because Stale Or Conflicting

| Source | Legacy rule | Reason |
| --- | --- | --- |
| `docs/030-Specs/Spec-Product-Management.md` | Order creation decrements stock immediately. | Current code reserves on order creation and decrements `onHand` at stock-out. |
| `docs/030-Specs/Spec-Order-Management.md` | Single order status flow `pending -> paid -> preparing -> shipping -> delivered`. | Current model separates `paymentStatus` and `fulfillmentStatus`. |
| `docs/030-Specs/Spec-Order-Management.md` | Supplier orders are never auto-created from sales orders. | Current `createOrder` auto-creates shortage supplier orders by default unless disabled. |
| `docs/030-Specs/Spec-Order-Management.md` | Paid orders can be delivered directly. | Current completion requires `stock_out` and full payment. |
| `docs/030-Specs/Spec-Finance-Accounting.md` | Official COGS is the order-time cost snapshot. | Current stock-out re-snapshots COGS from live WAC. |
| `docs/030-Specs/Spec-Customer-CRM.md` | Customer codes are sequential `KH001`, `KH002`, etc. | Current customer code generation uses the `KH` prefix with timestamp/collision handling. |
| `plans/260512-0235-sapo-reports-expansion/phase-03-sales-reports.md` | Sales reports use `orders.total` and `created_at`. | Current official P&L excludes shipping and uses stock-out timing for realized revenue. |
| `plans/260512-0214-admin-user-story-tc/test-cases/11-orders.md` | Stock-out should block insufficient stock and cancellation from stock-out restores stock. | Current stock-out has no service-level insufficient-stock precheck and current DB migrations allow negative `onHand`. Returns handle stock restoration after stock-out/completion. |
| `docs/admin-test-cases.md` | Category deletion only allowed when empty and with no subcategories. | Current service deletes the category and lets child categories become roots. |
| `docs/admin-user-stories.md` | Supplier order statuses `Pending -> Confirmed -> Delivered`. | Current statuses are `pending`, `ordered`, `received`, `cancelled`. |
| `docs/admin-user-stories.md` and `docs/admin-test-cases.md` | Customer tier uses OR logic and labels the frequent tier as `Mua nhiều`. | Current code uses AND logic and labels the second tier `Thường xuyên`. |
| `docs/admin-user-stories.md` and `docs/admin-test-cases.md` | Customer tier settings live under `/customers`. | Current implementation edits tiers in `/settings` and stores `customer_tier_config`. |
| `docs/admin-test-cases.md` | Customer delete is deactivate-only. | Current customer service has hard delete, while active/inactive is a separate status toggle. |
| `docs/admin-test-cases.md` | Product image uploads enforce jpg/png/webp and 10MB. | Current product upload only documents UI `image/*` and max image count; server-side type/size policy is not defined. |
| `docs/admin-user-stories.md` and `docs/admin-test-cases.md` | Storefront banners use `top/middle/bottom` positions. | Current banners use `custom` or `category` type, active date windows, and `sortOrder`. |
| `docs/admin-test-cases.md` | Expense categories are rent/salary/ads/shipping/other. | Current expense schema uses `fixed` or `variable`. |
| `TC-SUP-ORDER-005.md` and `TC-SUP-ORDER-006.md` | Business-rule violations return HTTP 500. | Current docs should treat these as validation/business errors, not desired crashes. |
| `TC-INT-009.md` | Concurrent orders may both succeed and drive stock negative at order creation. | Current order creation locks variants and reserves stock; negative `onHand` can happen at stock-out, not creation. |

## Needs Product Confirmation

These candidates came from legacy plans/test cases but should not become hard rules without confirmation:

- Supplier payout may be unallocated to a receipt. If intentional, define whether it is supplier advance/credit.
- Supplier debt aggregates may count only completed receipts with remaining debt, excluding draft receipt debt.
- `referenceCode` may be meaningful only for bank transfer, but current services do not enforce method-specific rules.
- Customer debt aging tabs may need non-overlapping ranges instead of only `minAgeDays`.
- Debt collection from drawer may need FIFO allocation to oldest unpaid stock-out orders.
- Cancelling a completed receipt after later stock-outs needs a clear policy: reject, allow negative stock, or re-chain movements.
- Partial purchase order cancellation needs policy for received vs unreceived quantities.
- Receipt discount greater than item total plus extra cost needs policy: reject or allow negative payable.
- Settings write policy needs route matrix: owner-only write, manager read, or other split.
- Guest chat phone-based dedupe needs confirmation because current guest profile logic is session-code based.
- AI auto-reply flags, PII masking, max-turn limits, prompt precedence, and per-room pause need current code verification before documenting as active behavior.
- Duplicate product names appear allowed by legacy tests, but this is not an explicit current product policy.
- Pre-order storefront labels and exact timing need confirmation before strict UI tests.
- Low-stock badge/filter policy should be confirmed before enforcing threshold behavior in E2E.
- Inactive customers preserving order history but being blocked from new orders needs confirmation.
- Order status history should include actor full name in UI, but service only owns IDs/timestamps; confirm UI contract before testing.
- Debt payment amounts may need integer-VND validation; current service validates positive finite numbers.
- Supplier names may duplicate; confirm before making this a rule.
- Supplier deletion policy differs across docs and code: current service soft-deletes, while legacy docs mention blocking deletion when orders exist.
- Expenses category taxonomy such as rent/salary/ads/shipping/other is not in current shared schema.
- Product policy should confirm whether current AND-based customer tier logic is intended, or whether legacy OR behavior should replace it.
- Session idle timeout and same-browser session replacement need confirmation before becoming auth tests.
