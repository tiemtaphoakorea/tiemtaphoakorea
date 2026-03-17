---
id: TC-PROD-003
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-003: Create Product - Validation Errors

## Pre-conditions

- Logged in as Admin or Manager.
- On "New Product" form.

## Test Data

| Case | Name | Variants | Price | Stock | Expected Error |
| ---- | ---- | -------- | ----- | ----- | -------------- |
| A    | *(empty)* | 1 valid variant | 100,000 | 10 | "Tên sản phẩm không được để trống" |
| B    | "Valid Name" | 0 | 100,000 | 10 | "Cần ít nhất 1 biến thể" |
| C    | "Valid Name" | 1 variant | -1 | 10 | "Giá bán phải >= 0" |
| D    | "Valid Name" | 1 variant | 100,000 | -5 | "Số lượng không hợp lệ" |
| E    | "Valid Name" | 1 variant | 100,000 | 10 | "SKU không hợp lệ hoặc đã tồn tại" (SKU has invalid chars) |

## Test Steps

1. For each case, input the test data.
2. Click "Save".

## Expected Result

- Form displays the correct validation error.
- Product is not created.
