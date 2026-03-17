---
id: TC-SUP-ORDER-025
type: test-case
status: active
feature: Supplier Orders
created: 2026-02-02
updated: 2026-02-02
linked-to: [[Spec-Order-Management]]
---

# TC-SUP-ORDER-025: Set Timestamps Only on First Transition

## Pre-conditions

- Logged in as Admin.
- Valid product variant exists.

## Test Steps

1. Create order (status: pending).
2. Transition to ordered - record orderedAt.
3. Transition to ordered again - verify orderedAt unchanged.
4. Transition to received - record receivedAt.

## Expected Result

- orderedAt is set only on first transition to ordered.
- receivedAt is set only on first transition to received.
- Subsequent transitions do not modify timestamps.
