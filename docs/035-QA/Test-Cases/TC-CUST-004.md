---
id: TC-CUST-004
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-004: Customer List - Search & Filters

## Pre-conditions

- Logged in as Admin or Manager.
- Customers exist with mixed types (wholesale/retail).

## Test Steps

1. Search by name, phone, and customer code.
2. Filter by customer type "wholesale".
3. Filter by status Active/Inactive.

## Expected Result

- Search returns matching rows by name/phone/code.
- Filters return correct subsets and persist when paging.
