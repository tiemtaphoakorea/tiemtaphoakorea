# Reports And Finance

## Scope

This domain covers expenses, payouts, dashboard analytics, financial reports, inventory reports, sales reports, purchase reports, and customer reports.

## Key Admin Pages

- `/analytics`
- `/analytics/overview`
- `/analytics/products`
- `/analytics/inventory`
- `/analytics/finance`
- `/analytics/debts`
- `/reports`
- `/reports/profit-loss`
- `/reports/cash-flow`
- `/reports/customer-debts`
- `/reports/supplier-debts`
- `/expenses`
- `/payouts`

## Key Services

| Service group | Paths |
| --- | --- |
| Finance | `packages/database/src/services/finance.server.ts` |
| Analytics | `packages/database/src/services/analytics.server.ts`, `dashboard.server.ts` |
| Report entry | `packages/database/src/services/report.server.ts`, `report-shared.server.ts` |
| Financial reports | `report-financial-*.server.ts` |
| Inventory reports | `report-inventory-*.server.ts` |
| Sales reports | `report-sales-*.server.ts` |
| Purchase reports | `report-purchases-*.server.ts` |
| Customer reports | `report-customers-*.server.ts` |

## Canonical Financial Formulas

Official P&L and sales reports use the realized-sales basis:

- Eligible order: `cancelledAt IS NULL` and `fulfillmentStatus IN (stock_out, completed)`.
- Date anchor: `orders.stockOutAt`.
- Sales revenue: `subtotal - discount`.
- Shipping reimbursement is excluded from revenue, gross profit, and net profit.
- COGS: `sum(order_items.line_cost)`, snapshotted at stock-out.
- Gross profit: `salesRevenue - cogs`.
- Expenses: `sum(expenses.amount)` in the selected period.
- Supplier payouts are reported separately as cash movement; do not subtract them again from profit because product cost is already in COGS.
- Net profit: `grossProfit - expenses`.
- Orders with any missing-cost line are excluded from official P&L; missing-cost count/rate/order count/excluded revenue are reported separately.
- Paid but still-pending preorders stay out of official P&L until stock-out finalizes COGS.

Report family rules:

- Sales by time/customer/order/staff use the same stock-out date basis and exclude cancelled orders.
- Sales by time uses order-level `totalCost` and `profit` after stock-out.
- Sales by product uses `sum(order_items.line_total)`, `sum(order_items.line_cost)`, and `sum(order_items.line_profit)` over eligible order lines; order-level discount is not allocated to product rows.
- Sales by order debt is `max(0, (subtotal - discount) - paidAmount)` inside the realized order set.
- Payment reports group payment rows by method/staff/time for non-cancelled orders; they are cash collection reports, not revenue recognition.
- Purchase reports use completed, non-cancelled goods receipts and date anchor `COALESCE(received_at, created_at)`.
- Purchase amount is receipt payable amount; paid/debt use receipt payment fields.
- Purchase payout reports use `supplier_payments.paid_at` and `supplier_payments.amount`.
- Current stock reports are real-time snapshots: `onHand`, `reserved`, `available = onHand - reserved`, and stock value `onHand * costPrice`.
- Inventory XNT uses `inventory_movements`: stock-in from `supplier_receipt`, stock-out from negative `stock_out`, adjustments from `manual_adjustment`, `stock_count_balance`, `cost_adjustment`, and `cancellation`.

Known non-canonical dashboards:

- `/analytics/overview` still uses paid-order lifetime totals and `orders.total`; do not treat it as the official P&L formula.
- Dashboard KPI revenue uses completed orders and `orders.total`; it is an operational dashboard metric, not the accounting source of truth.
- Some stock alert screens use `onHand`, while analytics stock alerts use available stock; confirm desired product policy before rewriting tests around this difference.
- Customer debt report services currently use created-order totals/payment rows, while order-debt screens use stock-out unpaid debt. Confirm the desired debt-report policy before rewriting those tests.

Expense rules:

- Expenses reduce net profit.
- Expenses are `fixed` or `variable`; shared schema requires description, positive amount, type, and date.
- Legacy expense categories like rent, salary, ads, shipping, and other are not current shared-schema values.

Read `docs/current/06-business-rules.md` before changing report tests or accounting behavior.

## Test Guidance

Financial math should be covered with Vitest service tests first. Browser tests should focus on navigation, filtering, export controls, and visible report state.
