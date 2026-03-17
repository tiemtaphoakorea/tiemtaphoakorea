---
id: TC-INT-004
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-004: Order Creates Customer and Updates History

## Pre-conditions

- Logged in as Staff or Admin.
- Customer with phone 0900000000 does not exist.
- At least one active product variant in stock.

## Test Steps

1. Create a new order with customer phone 0900000000 and one in-stock item.
2. Save the order.
3. Open Customers list and search for phone 0900000000.
4. Open the customer detail page.

## Expected Result

- Customer profile is auto-created from the order.
- Customer appears in the customer list with generated customer_code.
- Order history for the customer includes the newly created order.

## Related Docs

- [[Spec-Customer-CRM]]
- [[Spec-Order-Management]]
