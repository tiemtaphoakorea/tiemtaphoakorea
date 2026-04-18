---
id: TC-DASH-012
type: test-case
status: missing
feature: Dashboard
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Dashboard-Reports]]
---

# TC-DASH-012: Dashboard KPI Exact Delta Verification

## Pre-conditions

- Admin logged in.
- Dashboard is visible with known initial state.

## Test Steps

1. Record initial dashboard KPI values via `GET /api/admin/dashboard` and from the UI.
2. Verify API value and UI value match for `todayOrders`.
3. Create exactly 1 new order via API.
4. Re-fetch dashboard data and UI.
5. Assert `todayOrders` incremented by exactly 1.
6. Assert `todayRevenue` incremented by exactly the order total.
7. Assert UI value equals API value for both metrics.

## Expected Result

- `todayOrders` increases by exactly 1 after creating 1 order.
- `todayRevenue` increases by exactly the order's total amount.
- UI and API values are identical (no display rounding discrepancy).

## Spec File

`tests/e2e/dashboard/kpi-exact.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- **TC-DASH-002** (`kpi-calculation.spec.ts`) asserts `todayOrdersCount >= initialCount` which allows any number of new orders or even concurrent test pollution to pass the check.
- No test verifies the exact +1 delta or that UI and API values agree.

## Coverage Gaps

- Exact delta verification
- UI/API value synchronization
- Revenue increment accuracy
