---
id: TC-CUST-006
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-006: Customer Deactivate & Reactivate

## Pre-conditions

- Logged in as Admin.
- Existing active customer.

## Test Steps

1. Open customer detail.
2. Deactivate the customer.
3. Confirm status changes to inactive in list.
4. Reactivate the customer.

## Expected Result

- Customer status toggles correctly.
- Inactive customers are hidden when filter = Active.
