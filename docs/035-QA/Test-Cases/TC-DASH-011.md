---
id: TC-DASH-011
type: test-case
status: draft
feature: Dashboard
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-011: Dashboard Empty State

## Pre-conditions

- Logged in as Admin or Owner.
- No orders, payments, or expenses exist for the selected date range.

## Test Steps

1. Open Dashboard for the empty date range.

## Expected Result

- KPIs show zero values.
- Charts display empty state without errors.

## Related Docs

- [[Spec-Dashboard-Reports]]
