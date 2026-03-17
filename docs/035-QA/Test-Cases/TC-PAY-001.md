---
id: TC-PAY-001
type: test-case
status: active
feature: Payment
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-PAY-001: Partial Payment Recording

## Pre-conditions

- Logged in as Staff or Manager.
- Order exists with total = 500,000, paid_amount = 0 (Payment Status = "Unpaid").

## Test Steps

1. Open the Order details.
2. Click "Add Payment".
3. Enter Amount: 200,000.
4. Select Method: "Cash".
5. Save payment.
6. Verify Payment Status changes to "Partially Paid" (derived from paid_amount < total).
7. Verify Remaining Balance = 300,000.
8. Add another payment of 300,000.
9. Verify Payment Status changes to "Paid" and Order status becomes "paid".

## Expected Result

- Payment logs record each transaction.
- Remaining balance updates correctly.
- Status transitions (derived): Unpaid → Partially Paid → Paid.
