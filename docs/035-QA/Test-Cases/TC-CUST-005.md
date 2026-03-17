---
id: TC-CUST-005
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-005: Customer Classification Change

## Pre-conditions

- Logged in as Admin or Manager.
- Existing customer with type "retail".

## Test Steps

1. Open customer detail.
2. Change type to "wholesale".
3. Save changes.

## Expected Result

- Customer type updates in detail and list.
- Order creation uses the updated customer type for pricing rules (if applicable).
