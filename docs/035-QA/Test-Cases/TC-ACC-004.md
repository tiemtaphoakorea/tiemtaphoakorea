---
id: TC-ACC-004
type: test-case
status: draft
feature: Accounting
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-004: Report Date Range Validation

## Pre-conditions

- Logged in as Admin.

## Test Steps

1. Set date range with start date after end date.
2. Set date range longer than 1 year.

## Expected Result

- Validation errors displayed: "Ngày bắt đầu phải trước ngày kết thúc" and "Khoảng thời gian tối đa là 1 năm".
