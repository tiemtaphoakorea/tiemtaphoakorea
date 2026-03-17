---
id: TC-ORD-025
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-025: Order Total Recalculation with Multiple Items

## Pre-conditions

- Logged in as Staff or Admin.
- Two variants exist with known prices.

## Test Steps

1. Create order with Variant A qty 2 and Variant B qty 1.
2. Verify subtotal and total fields.

## Expected Result

- Subtotal equals sum of item subtotals.
- Total includes any configured fees/discounts (if applicable).

## Related Docs

- [[Spec-Order-Management]]
