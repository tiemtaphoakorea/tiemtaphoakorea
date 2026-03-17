---
id: TC-SUP-ORDER-014
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-014: Pagination Functionality

## Pre-conditions

- Logged in as Admin.
- Multiple supplier orders exist (more than page size).

## Test Steps

1. Navigate to supplier orders list (`/supplier-orders`).
2. Check if pagination controls are visible.
3. If multiple pages exist, click "Trang sau" / "Next".
4. Click "Trang trước" / "Previous" to go back.

## Expected Result

- Pagination controls appear when orders exceed page size.
- Next/Previous buttons work correctly.
- Button states (enabled/disabled) are correct.
