---
id: TC-INT-009
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-009: Concurrent Orders for Same Stock

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A stock_type = in_stock, stock_quantity = 1.
- Two separate sessions (A and B).

## Test Steps

1. Session A creates an order for Variant A quantity = 1.
2. At the same time, Session B creates an order for Variant A quantity = 1.

## Expected Result

- Cả hai đơn đều thành công (hệ thống không chặn theo tồn kho; cho phép tồn kho âm).
- Stock = 1 - 1 - 1 = -1.

## Related Docs

- [[Spec-Order-Management]]
