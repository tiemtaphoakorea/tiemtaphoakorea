---
id: TC-CAT-004
type: test-case
status: needs-fix
feature: Product Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Product-Management]]
---

# TC-CAT-004: Category List

## Pre-conditions

- Logged in as Admin or Manager.
- Multiple categories exist.

## Test Steps

1. Open Categories management page.
2. Observe the list of categories.
3. Verify count, names, and any metadata columns are displayed.

## Expected Result

- All categories are displayed with correct names.
- Pagination appears when category count exceeds page size.

## Spec File

`tests/e2e/categories/list.spec.ts`

## Review Status

⚠️ Has Issues

## Review Findings

- **HIGH**: Previously mislabeled `TC-PROD-014` alongside 4 other category tests.
- **LOW**: Current test only checks heading and table element exist — passes even if table is empty.

## Coverage Gaps

- Pagination behavior for many categories.
- Empty state when no categories exist.
- Column headers and row data content verified.
