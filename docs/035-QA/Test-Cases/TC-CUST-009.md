---
id: TC-CUST-009
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-009: Customer Stats Calculation

## Pre-conditions

- Logged in as Admin.
- Customer has delivered and cancelled orders.

## Test Steps

1. Open customer detail.
2. Verify total orders, delivered orders, cancelled orders, total spent, and last order date.

## Expected Result

- Stats match order history calculations.
- Total spent sums delivered orders only.
