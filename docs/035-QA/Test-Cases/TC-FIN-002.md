---
id: TC-FIN-002
type: test-case
status: active
feature: Finance
created: 2026-02-01
updated: 2026-02-01
linked-to: [[Spec-Finance-Accounting]]
---

# TC-FIN-002: Change Month/Year Filters on Finance Dashboard

## Pre-conditions

- Logged in as Admin.
- On Finance page (`/finance`).
- Month and/or Year filter controls are present.

## Test Steps

1. Navigate to Finance page (`/finance`).
2. Locate "Tháng" (Month) and/or "Năm" (Year) controls.
3. Open Month selector and choose an option.
4. Open Year selector and choose an option if present.

## Expected Result

- Filters can be changed without error.
- UI updates according to selected period (if applicable).
