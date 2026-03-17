---
id: TC-SUP-ORDER-006
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-006: Restrict Delete to Pending and Cancelled Orders

## Pre-conditions

- Logged in as Admin.
- Multiple supplier orders exist with different statuses.

## Test Steps

1. Create a pending order and delete it via API.
2. Create an order, change to "ordered", try to delete via API.
3. Create an order, change to "received", try to delete via API.
4. Create an order, change to "cancelled", delete it via API.

## Expected Result

- Pending order: Delete succeeds (200).
- Ordered order: Delete fails (500).
- Received order: Delete fails (500).
- Cancelled order: Delete succeeds (200).
