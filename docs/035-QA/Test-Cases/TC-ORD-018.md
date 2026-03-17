---
id: TC-ORD-018
type: test-case
status: draft
feature: Order Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-018: Order Item Quantity Edit Blocked

## Pre-conditions

- Logged in as Staff or Admin.
- Existing order with items.

## Test Steps

1. Open order detail.
2. Attempt to edit item quantity or product list.

## Expected Result

- UI prevents editing item quantities/products.
- If attempted via API, request is rejected.

## Related Docs

- [[Spec-Order-Management]]
