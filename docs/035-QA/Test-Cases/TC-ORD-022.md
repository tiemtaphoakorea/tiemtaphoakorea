---
id: TC-ORD-022
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-022: Cancel Paid Order Restores Stock and Keeps Payment History

## Pre-conditions

- Logged in as Admin.
- Order exists with status paid and in_stock items.
- Payments recorded for the order.

## Test Steps

1. Cancel the paid order.
2. Open order detail and payment history.
3. Open product variant stock.

## Expected Result

- Order status becomes cancelled.
- Stock quantities are restored for in_stock items.
- Payment history remains visible for audit.

## Related Docs

- [[Spec-Order-Management]]
