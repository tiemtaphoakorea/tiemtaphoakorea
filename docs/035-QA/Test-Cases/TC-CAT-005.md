---
id: TC-CAT-005
type: test-case
status: needs-fix
feature: Product Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Product-Management]]
---

# TC-CAT-005: Category Search

## Pre-conditions

- Logged in as Admin or Manager.
- Multiple categories exist with distinct names.

## Test Steps

1. Open Categories management page.
2. Enter a search term in the search box.
3. Wait for filtered results.
4. Verify only categories matching the search term are displayed.
5. Clear the search and verify all categories return.

## Expected Result

- Only matching categories shown after search.
- Non-matching categories hidden.
- Empty state shown if no categories match the search.

## Spec File

`tests/e2e/categories/search.spec.ts`

## Review Status

⚠️ Has Issues

## Review Findings

- **HIGH**: Previously mislabeled `TC-PROD-014` alongside 4 other category tests.
- **LOW**: Current spec only asserts `page.url().toContain("search=E2E")` — URL check only, no result content verified.

## Coverage Gaps

- Verify rendered result content, not just URL parameter.
- No-result empty state not tested.
- Search by partial name not tested.
