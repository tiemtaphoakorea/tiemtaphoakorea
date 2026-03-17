---
id: TC-ORD-012
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-012: Delete Order Rules

## Pre-conditions

- Logged in as Admin.
- Order A status = pending with in_stock items.
- Order B status = cancelled.
- Order C status = paid.

## Test Steps

1. Delete Order A.
2. Delete Order B.
3. Attempt to delete Order C.

## Expected Result

- Order A is deleted and stock is restored for in_stock items.
- Order B is deleted successfully.
- Order C deletion is blocked (not allowed for paid/preparing/shipping/delivered).
- Supplier orders are independent and are not deleted when an order is deleted.
