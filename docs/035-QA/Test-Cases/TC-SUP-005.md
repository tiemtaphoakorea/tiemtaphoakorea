---
id: TC-SUP-005
type: test-case
status: draft
feature: Supplier Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Supplier-Management]]
---

# TC-SUP-005: Supplier Stats and Recent Orders

## Pre-conditions

- Logged in as Admin or Manager.
- Supplier has supplier_orders in statuses pending/ordered/received/cancelled.

## Test Steps

1. Open supplier detail view.
2. Verify counts per status.
3. Verify total cost value.
4. Verify recent orders list shows latest items.

## Expected Result

- Status counts match actual supplier_orders data.
- Total cost is sum of actual cost prices (0 if none).
- Recent orders list shows latest supplier orders sorted by created date.

## Related Docs

- [[Spec-Supplier-Management]]
