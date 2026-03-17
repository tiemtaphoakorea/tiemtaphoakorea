---
id: TC-CUST-001
type: test-case
status: active
feature: Customer Management
created: 2026-01-21
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-001: Customer Profile CRUD

## Pre-conditions

- Logged in as Owner or Manager.

## Test Steps

1. Navigate to "Customers" > "New Customer".
2. Enter Name: "Nguyễn Văn A".
3. Enter Phone: "0901234567".
4. Click "Save".
5. Verify customer code is auto-generated (e.g., CUST-001).
6. Edit customer, change Phone to "0987654321".
7. Save changes.
8. Navigate to customer profile.
9. Click "Delete".
10. Confirm deletion.

## Expected Result

- Customer created with auto-generated code.
- Customer details update correctly.
- Customer is soft-deleted (or archived).
