---
id: TC-ORD-011
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-011: Order Number Format and Uniqueness

## Pre-conditions

- Logged in as Staff or Admin.
- System date is known (e.g., 2026-01-28).

## Test Steps

1. Create two orders on the same day.
2. Record the generated order numbers.

## Expected Result

- Order numbers follow format `ORD-YYYYMMDD-XXX`.
- Sequence increments per day (e.g., ...-001, ...-002).
- No duplicate order numbers.
