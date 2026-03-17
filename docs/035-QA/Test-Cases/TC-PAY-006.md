---
id: TC-PAY-006
type: test-case
status: draft
feature: Payment
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-PAY-006: Multiple Payments Update Remaining Balance

## Pre-conditions

- Logged in as Staff or Admin.
- Order total = 1,000,000.

## Test Steps

1. Record payment of 300,000.
2. Record payment of 500,000.
3. Record payment of 200,000.

## Expected Result

- Remaining balance updates after each payment.
- Final status becomes paid when total paid equals order total.

## Related Docs

- [[Spec-Order-Management]]
