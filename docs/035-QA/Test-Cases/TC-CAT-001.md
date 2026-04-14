---
id: TC-CAT-001
type: test-case
status: needs-fix
feature: Product Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Product-Management]]
---

# TC-CAT-001: Category Create

## Pre-conditions

- Logged in as Admin or Manager.
- No category with the test name exists.

## Test Steps

1. Open Categories management page.
2. Click "New Category" (or equivalent CTA).
3. Enter a unique category name.
4. Click "Save".
5. Verify the new category appears in the categories list.

## Expected Result

- New category is created and appears in the list.
- Category name is displayed correctly.
- Category is available in product assignment dropdowns.

## Spec File

`tests/e2e/categories/create.spec.ts`

## Review Status

⚠️ Has Issues

## Review Findings

- **HIGH**: Previously labeled `TC-PROD-014` alongside 4 other distinct category tests (delete, edit, list, search). All 5 category files shared the same ID — impossible to trace which category operation failed in CI reports.

## Coverage Gaps

- Duplicate category name handling not tested.
- Verify category appears in product form's category dropdown after creation.
