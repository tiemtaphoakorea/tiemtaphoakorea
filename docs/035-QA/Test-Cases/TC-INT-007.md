---
id: TC-INT-007
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-007: Order Cancel Restores Stock and Updates Dashboard Low Stock

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A stock_quantity = 2, low_stock_threshold = 2.
- Order exists with Variant A quantity = 2 and status = pending.

## Test Steps

1. Cancel the order.
2. Open Product list and Dashboard Low Stock widget.

## Expected Result

- Variant A stock_quantity increases back to 2.
- Low stock indicator reflects updated stock quantity.

## Related Docs

- [[Spec-Order-Management]]
- [[Spec-Dashboard-Reports]]
