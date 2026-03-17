---
id: TC-CUST-010
type: test-case
status: draft
feature: Customer Management
created: 2026-01-29
updated: 2026-01-29
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-010: Duplicate Customer Phone Handling

## Pre-conditions

- Logged in as Staff or Admin.
- Customer with phone 0900000001 exists.

## Test Steps

1. Create a new customer with phone 0900000001.
2. Save the form.

## Expected Result

- System shows error for duplicate phone.
- Customer is not created.

## Related Docs

- [[Spec-Customer-CRM]]
