---
id: TC-INT-011
type: test-case
status: draft
feature: Cross-Feature Integration
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-INT-011: Retry After Create Order Failure

## Pre-conditions

- Logged in as Staff or Admin.
- Variant A stock_type = in_stock, stock_quantity = 1.
- Simulate failure on first submit (network error or server 500).

## Test Steps

1. Attempt to create order for Variant A quantity = 1 and force a failure.
2. Retry the request once.

## Expected Result

- Order is created only once after retry.
- Stock is reduced by 1 only once.
- No duplicate order records exist.

## Related Docs

- [[Spec-Order-Management]]
