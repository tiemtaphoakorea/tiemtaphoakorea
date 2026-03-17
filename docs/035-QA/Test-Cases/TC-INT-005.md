---
id: TC-INT-005
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-005: Payment Updates Order Status and Dashboard KPIs

## Pre-conditions

- Logged in as Staff or Admin.
- Existing order with status = pending and total = 1,000,000.
- Dashboard shows baseline revenue/paid totals.

## Test Steps

1. Record a payment of 400,000 for the order.
2. Verify order payment status.
3. Record another payment of 600,000.
4. Open Dashboard KPIs.

## Expected Result

- After first payment, order payment status is "partially_paid".
- After full payment, order status becomes "paid".
- Dashboard revenue/paid totals reflect the full payment.

## Related Docs

- [[Spec-Order-Management]]
- [[Spec-Finance-Accounting]]
- [[Spec-Dashboard-Reports]]
