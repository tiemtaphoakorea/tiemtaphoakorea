---
id: TC-ORD-008
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-008: Supplier Order Lifecycle

## Pre-conditions

- Logged in as Admin.
- Supplier order exists (created independently, not linked to any order); status = pending.

## Test Steps

1. Open Supplier Orders list.
2. Mark the supplier_order as "ordered".
3. Mark the supplier_order as "received".

## Expected Result

- supplier_order transitions: pending → ordered → received with timestamps.
- Order and supplier order are independent; order status is managed separately from supplier orders.
