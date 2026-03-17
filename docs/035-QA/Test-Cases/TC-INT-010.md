---
id: TC-INT-010
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-010: Double-Submit Create Order Prevented

## Pre-conditions

- Logged in as Staff or Admin.
- At least one in_stock variant with stock_quantity >= 2.

## Test Steps

1. Fill Create Order form with a single item.
2. Double-click "Create Order" quickly.

## Expected Result

- Only one order is created.
- Stock is reduced once.

## Related Docs

- [[Spec-Order-Management]]
