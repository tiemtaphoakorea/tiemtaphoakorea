---
id: TC-CUST-012
type: test-case
status: missing
feature: Customer Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-012: Customer Reactivation Cycle

## Pre-conditions

- Admin logged in.
- At least one active customer exists.

## Test Steps

1. Deactivate the customer via the UI or API.
2. Verify the customer status is `inactive`.
3. Verify the customer cannot be selected when creating a new order (or is marked inactive in dropdowns).
4. Reactivate the customer via the UI.
5. Verify the customer status is `active`.
6. Verify the customer can now be selected in order creation.

## Expected Result

- Full deactivate → reactivate cycle completes successfully.
- Customer's order history is preserved through the cycle.
- Customer can receive new orders after reactivation.

## Spec File

`tests/e2e/customers/reactivate.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No standalone reactivation test exists for customers (unlike users which have `reactivate.spec.ts`).
- `deactivate.spec.ts` has a dangerous toggle-back inside the test body (not in `afterEach`) — if the test fails, the primary seed customer remains deactivated and breaks subsequent tests.

## Coverage Gaps

- Customer reactivation
- Order creation blocked for inactive customer
- Order creation unblocked after reactivation
