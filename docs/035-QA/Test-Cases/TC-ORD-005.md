---
id: TC-ORD-005
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-005: Cancel Order Restores Stock

## Pre-conditions

- Logged in as Admin.
- Order with in_stock item qty 3 (stock originally 10, now 7).
- Order status is pending or paid.

## Test Steps

1. Cancel the order.

## Expected Result

- Order status becomes "cancelled".
- Stock is restored to 10 for the in_stock variant.
- Supplier orders (if any) are unchanged — order and supplier orders are independent.
