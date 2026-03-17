---
id: TC-ORD-007
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-007: Order List - Search & Filters

## Pre-conditions

- Logged in as Staff or Admin.
- Orders exist with varying status and dates.

## Test Steps

1. Search by order number (exact match).
2. Filter by status "pending".
3. Filter by date range (last 7 days).
4. Combine status + date filters.

## Expected Result

- Results match search term and filters.
- Sorting remains newest-first.
