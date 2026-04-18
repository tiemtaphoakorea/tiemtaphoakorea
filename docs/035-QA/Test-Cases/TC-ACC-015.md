---
id: TC-ACC-015
type: test-case
status: missing
feature: Accounting
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Finance-Accounting]]
---

# TC-ACC-015: COGS Calculation Accuracy

## Pre-conditions

- Admin logged in.
- A product exists with a known `costPrice` (e.g., 80,000 VND).
- An order for 2 units of that product has been created and paid.

## Test Steps

1. Create a product with `costPrice: 80000` and `retailPrice: 150000`.
2. Create and pay an order for 2 units.
3. Fetch the finance summary for the current month.
4. Calculate expected COGS: `80000 × 2 = 160000`.
5. Assert `financeData.cogs === 160000`.
6. Update the product's `costPrice` to 90000.
7. Create and pay a second order for 1 unit.
8. Re-fetch the finance summary.
9. Assert COGS increased by 80000 (snapshot from order 1) + 90000 (snapshot from order 2) = 250000.

## Expected Result

- COGS uses the `costPrice` snapshot at time of order, not the current cost price.
- `netProfit = revenue - COGS - expenses` is accurate.

## Spec File

`tests/e2e/accounting/cogs-accuracy.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- **TC-ACC-001** (`pnl-calculation.spec.ts`) only verifies the arithmetic formula `netProfit = revenue - cogs - expenses` is consistent within the API, but never verifies that the underlying `cogs` value itself is correctly computed from cost price snapshots.
- No test verifies that cost price changes after order creation do not retroactively affect COGS.

## Coverage Gaps

- COGS computed from per-item cost snapshot
- Price change after order does not affect historical COGS
