---
id: TC-CUST-011
type: test-case
status: missing
feature: Customer Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-011: Customer Profile Edit

## Pre-conditions

- Admin logged in.
- At least one active customer exists.

## Test Steps

1. Navigate to the customer detail page.
2. Click "Edit" on the customer profile.
3. Update `fullName` to a new value.
4. Update `phone` to a new valid number.
5. Update `address` if the field exists.
6. Click "Save".
7. Re-fetch the customer via API and verify updated fields.

## Expected Result

- Updated `fullName`, `phone`, and `address` are persisted.
- Customer list displays the new name.
- Customer order history is preserved (edit does not delete linked records).

## Spec File

`tests/e2e/customers/edit.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- Customer profile editing is **completely absent** from E2E tests.
- `customer-crud.spec.ts` claims CRUD coverage but only tests create, deactivate, and read flows; no update.
- `classification.spec.ts` tests type change (retail/wholesale) but not basic profile fields.

## Coverage Gaps

- Edit fullName, phone, address
- Phone number uniqueness validation on edit (change to a phone that already belongs to another customer)
