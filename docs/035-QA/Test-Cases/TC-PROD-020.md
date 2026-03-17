---
id: TC-PROD-020
type: test-case
status: draft
feature: Product Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-020: Concurrent Stock Update vs Order Creation

## Pre-conditions

- Logged in as Admin or Manager.
- Variant A stock_type = in_stock, stock_quantity = 5.
- Two sessions: Admin A and Staff B.

## Test Steps

1. Admin A edits Variant A stock_quantity to 3 but does not save yet.
2. Staff B creates an order for Variant A quantity = 2.
3. Admin A saves the stock update.
4. Refresh product detail.

## Expected Result

- Final stock reflects a consistent result without going negative.
- No lost update: stock reflects both the manual change and the order deduction.
- If conflict occurs, system should prompt to refresh or reject stale update.

## Related Docs

- [[Spec-Product-Management]]
- [[Spec-Order-Management]]
