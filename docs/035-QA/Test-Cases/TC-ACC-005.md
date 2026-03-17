---
id: TC-ACC-005
type: test-case
status: draft
feature: Accounting
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-005: Top Products by Profit

## Pre-conditions

- Logged in as Admin.
- Delivered orders exist across multiple products.

## Test Steps

1. Open the "Top Products" report.
2. Sort by profit.

## Expected Result

- Products are ordered by total profit (desc).
- Quantities, revenue, and profit totals match delivered orders only.
