---
id: TC-ORD-002
type: test-case
status: draft
feature: Order Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-002: Create Order - Validation Errors

## Pre-conditions

- Logged in as Staff or Admin.
- On "New Order" page.

## Test Data

| Case | Customer | Items | Quantity | Expected Error |
| ---- | -------- | ----- | -------- | -------------- |
| A    | *(none)* | 1 valid item | 1 | "Vui lòng chọn khách hàng" |
| B    | Valid customer | 0 | - | "Đơn hàng phải có ít nhất 1 sản phẩm" |
| C    | Valid customer | 1 item | 0 | "Số lượng phải lớn hơn 0" |
| D    | Valid customer | Invalid variant | 1 | "Sản phẩm không tồn tại" |

## Test Steps

1. For each case, input data as specified.
2. Click "Create Order".

## Expected Result

- Form shows correct validation error per case.
- No order is created.
