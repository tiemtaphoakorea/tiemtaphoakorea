---
id: TC-CAT-002
type: test-case
status: needs-fix
feature: Product Management
created: 2026-04-09
updated: 2026-04-09
linked-to: [[Spec-Product-Management]]
---

# TC-CAT-002: Category Delete

## Pre-conditions

- Logged in as Admin or Manager.
- At least one deletable category exists (no products assigned, or deletion cascades).

## Test Steps

1. Open Categories management page.
2. Select an existing category.
3. Click "Delete".
4. Confirm deletion in the dialog.
5. Verify the category is removed from the list.

## Expected Result

- Category is removed from the categories list.
- Deleted category no longer appears in product assignment dropdowns.

## Spec File

`tests/e2e/categories/delete.spec.ts`

## Review Status

⚠️ Has Issues

## Review Findings

- **HIGH**: Previously mislabeled `TC-PROD-014` alongside 4 other category tests.

## Coverage Gaps

- Deleting a category that still has products assigned — should fail gracefully or cascade.
- Undo/recovery after accidental deletion not tested.
