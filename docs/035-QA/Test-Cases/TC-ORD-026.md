---
id: TC-ORD-026
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-026: Order with Zero Items Rejected

## Pre-conditions

- Logged in as Staff or Admin.

## Test Steps

1. Open Create Order.
2. Attempt to save with no items.

## Expected Result

- System shows validation error and does not create order.

## Related Docs

- [[Spec-Order-Management]]
