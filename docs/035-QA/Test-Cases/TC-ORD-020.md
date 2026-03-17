---
id: TC-ORD-020
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-020: Cancel Order with Pre-order Items (Order and Supplier Order Independent)

## Pre-conditions

- Logged in as Admin.
- Order exists with at least one pre_order item (and optionally in_stock items).

## Test Steps

1. Open order detail.
2. Cancel the order.

## Expected Result

- Order status becomes cancelled.
- Stock is restored for in_stock items only; no stock changes for pre_order items.
- Supplier orders (if any exist) are unchanged — order and supplier orders are independent; no link between them.

## Related Docs

- [[Spec-Order-Management]]
