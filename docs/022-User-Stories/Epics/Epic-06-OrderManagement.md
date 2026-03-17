---
id: EPIC-006
type: epic
status: active
title: Order Management
project: Auth Shop Platform
linked-to: [[PRD-AuthShopPlatform]]
---

# Epic: Order Management

## Description

The core workflow for Admins to create and manage orders, handling stock deduction, pre-orders, and complex status flows.

## Related Specs

- [[Spec-Order-Management]]

## User Stories

- **Story-6.1**: As an Admin, I want to create an order for a customer by selecting products.
- **Story-6.2**: As an Admin, I want the system to handle split logic (In-Stock vs Pre-Order items) automatically.
- **Story-6.3**: As an Admin, I want to filter and search the list of orders.
- **Story-6.4**: As an Admin, I want to view Order Details, including Status segments (Pending, Paid, Preparing, Shipping, Delivered, Cancelled).
- **Story-6.5**: As an Admin, I want to update the status of individual items (Pending -> Ordered -> Received -> Cancelled).
- **Story-6.6**: As an Admin, I want to Cancel an order and have stock automatically returned.
- **Story-6.7**: As an Admin, I want to process Returns and Exchanges with correct inventory updates.
- **Story-6.8**: As an Admin, I want to support partial payments and staged delivery flows (Shipping → Delivered).
