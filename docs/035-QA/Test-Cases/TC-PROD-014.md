---
id: TC-PROD-014
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-014: Category Management (Create/Edit/Assign)

## Pre-conditions

- Logged in as Admin or Manager.
- At least one product exists.

## Test Steps

1. Open Categories management.
2. Create a new category "Chăm sóc da".
3. Edit the category name to "Chăm sóc da cao cấp".
4. Assign the category to an existing product and save.
5. Filter products by this category.

## Expected Result

- Category is created and updated successfully.
- Product shows assigned category in detail and list.
- Category filter returns only products in that category.
