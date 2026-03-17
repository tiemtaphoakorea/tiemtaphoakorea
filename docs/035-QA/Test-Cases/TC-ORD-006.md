---
id: TC-ORD-006
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-006: Payment Status Derivation

## Pre-conditions

- Logged in as Staff or Admin.
- Order total = 500,000; paid_amount = 0.

## Test Steps

1. Add payment 200,000.
2. Verify payment status shows "Partially Paid".
3. Add payment 300,000.
4. Verify payment status shows "Paid" and paid_amount = 500,000.

## Expected Result

- Payment status derives correctly from paid_amount vs total.
- Payment history shows two records with correct amounts.
