---
id: TC-ORD-009
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-009: Order Edit Restrictions

## Pre-conditions

- Logged in as Admin.
- Existing order in status "pending".

## Test Steps

1. Attempt to change order items or quantities.
2. Attempt to change the customer on the order.
3. Update admin note and save.

## Expected Result

- Editing items/quantities is blocked; system requires cancel + re-create.
- Changing customer is blocked.
- Admin note updates successfully.
