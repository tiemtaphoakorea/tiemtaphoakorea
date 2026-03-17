---
id: TC-CUST-008
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-008: Auto-Create Customer from Order

## Pre-conditions

- Logged in as Admin or Staff.
- Creating a new order for a customer not in the system.

## Test Steps

1. Start a new order.
2. Enter new customer details (name, phone, address).
3. Save the order.

## Expected Result

- A new customer profile is created.
- Customer code is generated.
- Order links to the newly created customer.
