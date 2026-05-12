# Test Cleanup Backlog

This file tracks test cleanup work found during the May 2026 audit. It is not a test status manifest; it is a short queue for agents.

Before rewriting a behavior test, read `06-business-rules.md` and the owning service. A test is worth keeping when it protects current app behavior, not when it merely exercises a page.

## Already Done

- `tests/security/**` removed from active Vitest coverage.
- `tests/e2e/security/**` removed from active Playwright coverage.
- `tests/e2e/auth/security.spec.ts` rate-limit false-positive removed.
- Customer duplicate phone and invalid phone tests rewritten.
- Access-control API expectations updated to distinguish `401` from `403`.
- `tests/unit/services/finance.server.test.ts` mock chain fixed and missing-cost P&L coverage added.
- `tests/e2e/orders/stock.spec.ts` rewritten for the reservation model: create order increases `reserved`, cancellation releases `reserved`, and insufficient stock no longer expects order creation to make `onHand` negative.

## Rewrite Next

| Priority | File | Issue | Action |
| --- | --- | --- | --- |
| P1 | `tests/integration/invoice-flow.test.ts` | Header comment and negative-inventory scenario disagree; current code allows negative `onHand` at stock-out, not at creation. | Keep the stock-out negative case only if product confirms this policy; otherwise rewrite service and test together. |
| P1 | `tests/unit/services/order.server.test.ts` | Fully mocked create-order cases duplicate stronger real-DB tests and mostly assert mocked calls. | Delete/merge cases already covered by `order.createOrder.test.ts`; keep only route/edge coverage that cannot be expressed with the real DB fixture. |
| P1 | `tests/e2e/receipts/payment-after-complete.spec.ts` | Uses API to complete an unpaid receipt, bypassing the UI gate that disables completion while debt remains. | Confirm policy: if UI gate is intended, test the UI lock; if API behavior is intended, document it as service-level exception. |
| P1 | `tests/e2e/accounting/report-date-range-api.spec.ts` | Invalid date range test passes if API incorrectly accepts the request. | Assert rejection for invalid range unconditionally. |
| P2 | `tests/e2e/finance/filters.spec.ts` | No real assertions if controls are absent. | Require controls or delete if obsolete. |
| P2 | `tests/e2e/accounting/export-report.spec.ts` | Passes when export button is absent. | Require export action or move to a real report export test. |

## Delete Or Merge

| File | Reason |
| --- | --- |
| `tests/e2e/customers/create.spec.ts` | Duplicated by stronger customer creation tests. |
| `tests/e2e/accounting/finance-ui.spec.ts` | Mostly optional probes; covered by stronger targeted accounting specs. |
| `tests/e2e/auth/security.spec.ts` | Remaining cases duplicate session/login coverage. |
| skipped placeholder tests in customer/settings specs | Non-applicable cases should not count as coverage. |

## Defer

- `tests/e2e/integration/integration.spec.ts` conditional assertions around order/customer/idempotency flows.
- `tests/unit/hooks/useDebounce.test.ts` and `tests/unit/hooks/useMobile.test.ts` implementation-mock style tests.
