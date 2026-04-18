---
id: TC-PAY-012
type: test-case
status: missing
feature: Payment
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-012: Card Payment Method Coverage

## Pre-conditions

- Admin logged in.
- An unpaid order exists.

## Test Steps

1. Record a full payment on the order using `method: "card"`.
2. Verify response is 200/201 and payment is recorded.
3. Fetch payment history for the order.
4. Verify a payment with `method: "card"` appears in the audit trail.
5. Verify order `paidAmount` equals the order total.

## Expected Result

- Card payment is accepted and recorded.
- Audit trail shows `method: card`.
- `referenceCode` handling is appropriate for card payments (may differ from bank_transfer).

## Spec File

`tests/e2e/payments/card-payment.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- `PAYMENT_METHOD.CARD` is defined in shared constants but **never used in any E2E test**.
- All payment tests use only `bank_transfer` or `cash`.
- Card payment may have different validation rules (reference code requirements, etc.) that are untested.

## Coverage Gaps

- Card payment method
- Reference code required/optional behavior per payment method
