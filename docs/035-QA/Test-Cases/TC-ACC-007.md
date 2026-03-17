---
id: TC-ACC-007
type: test-case
status: draft
feature: Accounting
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-007: Cost Price Validation vs Selling Price

## Pre-conditions

- Logged in as Admin.
- Variant has selling price = 100,000.

## Test Steps

1. Try to set cost_price = 120,000.

## Expected Result

- System blocks update with error "Giá vốn không nên cao hơn giá bán".
