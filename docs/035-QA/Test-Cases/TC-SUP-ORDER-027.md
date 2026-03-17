---
id: TC-SUP-ORDER-027
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-027: Handle Special Characters in Search

## Pre-conditions

- Logged in as Admin.
- Supplier orders page is accessible.

## Test Steps

1. Navigate to supplier orders list.
2. Search with special characters: <, >, &, ', ", %, *, ?
3. Verify application doesn't crash.

## Expected Result

- Application handles special characters gracefully.
- Either shows matching results or empty state.
- No crashes or errors.
