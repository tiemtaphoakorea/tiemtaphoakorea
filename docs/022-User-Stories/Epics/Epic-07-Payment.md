---
id: EPIC-007
type: epic
status: active
title: Payment
project: Auth Shop Platform
linked-to: [[PRD-AuthShopPlatform]]
---

# Epic: Payment

## Description

Manage financial transactions for orders, supporting partial payments and tracking remaining balances.

## Related Specs

- [[Spec-Finance-Accounting]]

## User Stories

- **Story-7.1**: As an Admin, I want to record payments (partial or full) for an Order.
- **Story-7.2**: As an Admin, I want to see the Payment History and remaining debt for an Order.
- **Story-7.3**: As an Admin, I want to see the payment status (Unpaid/Partially Paid/Paid) update automatically based on `paid_amount` vs `total`, and set Order status to `paid` when fully paid.
