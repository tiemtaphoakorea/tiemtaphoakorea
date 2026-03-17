---
id: TC-FIN-001
type: test-case
status: active
feature: Finance
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Finance-Accounting]]
---

# TC-FIN-001: Display Finance Dashboard

## Pre-conditions

- Logged in as Admin.
- Finance module is available.

## Test Steps

1. Navigate to Finance page (`/finance`).
2. Verify page heading contains "Tài chính" or "Finance".
3. Verify at least one of: "P&L", "Lợi nhuận", "Doanh thu" is visible.

## Expected Result

- Finance dashboard loads.
- Key financial metrics or labels are displayed.
