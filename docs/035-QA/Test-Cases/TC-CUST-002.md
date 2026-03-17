---
id: TC-CUST-002
type: test-case
status: draft
feature: Customer Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Customer-CRM]]
---

# TC-CUST-002: Create Customer - Validation Errors

## Pre-conditions

- Logged in as Admin or Manager.
- On "New Customer" form.

## Test Data

| Case | Full Name | Phone | Type | Expected Error |
| ---- | --------- | ----- | ---- | -------------- |
| A    | *(empty)* | 0901234567 | Retail | "Họ tên không hợp lệ" |
| B    | "Nguyễn Văn A" | abc123 | Retail | "Số điện thoại không hợp lệ" |
| C    | "Nguyễn Văn A" | 0901234567 | *(none)* | "Vui lòng chọn loại khách hàng" |

## Test Steps

1. Enter data per case.
2. Click "Save".

## Expected Result

- Correct validation message is displayed.
- Customer is not created.
