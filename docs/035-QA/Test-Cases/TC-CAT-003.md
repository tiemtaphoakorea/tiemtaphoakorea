---
id: TC-CAT-003
type: test-case
status: needs-fix
feature: Product Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Product-Management]]
---

# TC-CAT-003: Category Edit

## Pre-conditions

- Logged in as Admin or Manager.
- At least one category exists.

## Test Steps

1. Open Categories management page.
2. Select an existing category.
3. Edit the category name to a new unique name.
4. Click "Save".
5. Verify the updated name appears in the list.

## Expected Result

- Category name is updated in the list.
- Products already assigned to this category reflect the updated name.

## Spec File

`tests/e2e/categories/edit.spec.ts`

## Review Status

⚠️ Has Issues

## Review Findings

- **HIGH**: Previously mislabeled `TC-PROD-014` alongside 4 other category tests.

## Coverage Gaps

- Editing to a name that already exists (duplicate) not tested.
- Verify name update propagates to products already in this category.
