---
id: TC-FIN-003
type: test-case
status: missing
feature: Finance
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Finance-Accounting]]
---

# TC-FIN-003: Finance Filter Changes Displayed Data

## Pre-conditions

- Admin logged in.
- Finance data exists for at least two different months.

## Test Steps

1. Navigate to the Finance dashboard.
2. Record current displayed revenue and expense values.
3. Change the month filter to the previous month.
4. Verify displayed data changes to reflect the selected month.
5. Assert that values differ from the current month (or match zero if no data for that month).
6. Change back to the current month and verify original values return.

## Expected Result

- Selecting a different month changes the displayed revenue, expenses, and profit figures.
- The API request includes the selected month/year parameters.
- Data accurately reflects the selected time period.

## Spec File

`tests/e2e/finance/filter-changes-data.spec.ts` *(to be created)*

## Review Status

🔴 Not Tested

## Review Findings

- **TC-FIN-002** (`finance/filters.spec.ts`) clicks the month and year select elements and then **ends with zero assertions**. It never verifies that the displayed data changed. Test ALWAYS passes regardless of whether filter functionality is broken.

## Coverage Gaps

- Verify data changes when filter changes
- API call includes correct month/year parameters
- Round-trip: change filter, change back, verify original data returns
