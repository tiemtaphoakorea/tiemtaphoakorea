---
id: TC-PAY-011
type: test-case
status: missing
feature: Payment
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-011: Payment on Cancelled Order Rejected

## Pre-conditions

- An order exists that has been cancelled.

## Test Steps

1. Create an order via API.
2. Cancel the order via API.
3. Verify order status is `cancelled`.
4. Attempt to record a payment on the cancelled order via `POST /api/admin/orders/:id/payments`.
5. Check the response status and body.

## Expected Result

- API returns 400 or 422 (business rule rejection).
- Payment is NOT recorded (`paidAmount` remains 0).
- Order status remains `cancelled`.

## Spec File

`tests/e2e/payments/cancelled-order.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No test verifies that payments are blocked on cancelled orders.
- `validation.spec.ts` tests invalid methods/amounts but never tests payments on invalid order states.

## Coverage Gaps

- Payment on cancelled order
- Payment on already-fully-paid order (distinct from overpayment)
