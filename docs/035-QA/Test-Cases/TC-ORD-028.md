---
id: TC-ORD-028
type: test-case
status: missing
feature: Order Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-028: Full Order Lifecycle End-to-End

## Pre-conditions

- Admin logged in.
- Product with in-stock inventory and a customer exist.

## Test Steps

1. Create an order via API for the customer with 1 unit of the in-stock product.
2. Verify order status is `pending`.
3. Record full payment via API.
4. Verify order status changes to `paid`.
5. Update order status to `preparing`.
6. Verify status is `preparing` and history log has a PREPARING entry.
7. Update order status to `shipping`.
8. Verify status is `shipping`.
9. Update order status to `delivered`.
10. Verify status is `delivered`.
11. Verify order history contains all status transitions with timestamps.

## Expected Result

- All status transitions succeed in sequence.
- Order history contains PENDING → PAID → PREPARING → SHIPPING → DELIVERED entries.
- Stock decremented at creation and not restored (not cancelled).

## Spec File

`tests/e2e/orders/lifecycle.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- No single test covers the complete order lifecycle end-to-end.
- Individual status transitions are tested in isolation across multiple files but never as a complete sequence.

## Coverage Gaps

- Full lifecycle in a single cohesive test
- Verify all history entries are created with correct actor (changedBy) fields
