---
id: TC-PROD-002
type: test-case
status: draft
feature: Product Management
created: 2026-01-28
updated: 2026-01-28
linked-to: [[Spec-Product-Management]]
---

# TC-PROD-002: Product List - Search, Filters, Pagination

## Pre-conditions

- Logged in as Admin or Manager.
- At least 30 products across multiple categories with mixed stock statuses and active/inactive states.

## Test Data

| Case | Search | Category | Status   | Stock Status | Expected Result |
| ---- | ------ | -------- | -------- | ------------ | --------------- |
| A    | "kem" | All      | Active   | All          | Only products whose name or variant SKU matches "kem" |
| B    | *(empty)* | Skincare | Active | In Stock     | Only active products in Skincare with at least one in_stock variant |
| C    | *(empty)* | All    | Inactive | All          | Only inactive products |
| D    | *(empty)* | All    | Active   | Low Stock    | Only products with at least one variant <= low_stock_threshold |

## Test Steps

1. Open the Products list.
2. Apply each filter set from Test Data.
3. Navigate to page 2 and back to page 1.

## Expected Result

- Filters return the correct subsets based on name/SKU, category, status, and stock status.
- Pagination updates the list and counts correctly and retains active filters.
