---
phase: 4
title: "Category + Search Filter"
status: completed
priority: P2
effort: "1h"
dependencies: []
---

# Phase 04: Category + Search Filter

## Overview

Searching "kính" returns 135 products. Clicking "Kính mắt" chip while search is active → 0 results. Root cause is likely that products with "kính" in name are not assigned to the "kinh-mat" category in the DB. Fix includes: verify root cause, add UX guard, and document data fix if needed.

## Root Cause Analysis

**Code path** (`product.server.ts`, `getProductsForListing`):
```ts
filters = and(
  eq(products.isActive, true),
  ilike(products.name, '%kính%'),  // matches 135 products
  inArray(products.categoryId, ids) // ids resolved from slug "kinh-mat"
);
```
Both conditions must be true. If products with "kính" in their name have `categoryId = NULL` or a different category ID, the combined filter returns 0.

**Two possible root causes:**
1. **Data**: Products (glasses) not assigned `categoryId` pointing to "kinh-mat" category — fix in DB
2. **Slug mismatch**: Category slug stored in DB differs from "kinh-mat" used in URL (e.g. stored as "kinh-mat-v2", "glasses") → `ids = []` → early return `{ products: [], total: 0 }`

## Investigation Steps

1. Query the DB to verify:
```sql
-- Check category slug
SELECT id, name, slug FROM categories WHERE name ILIKE '%kính%' OR slug ILIKE '%kinh%';

-- Check if those products have a categoryId
SELECT p.name, p.category_id, c.slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.name ILIKE '%kính%'
LIMIT 10;
```

2. If slug mismatch → fix is in DB (update category slug OR update the chip to use correct slug)
3. If products have NULL categoryId → data fix: assign products to correct category in admin

## UX Fix (Code) — Always Apply

Regardless of data fix, improve the UX when category + search yields 0 results. Currently shows generic "Không tìm thấy sản phẩm". Add contextual hint:

**File**: `apps/main/components/category/category-listing.tsx` in the empty-state render:

```tsx
// If both search and category are active and 0 results:
{activeCategorySlugs.length > 0 && searchQuery && productsCount === 0 && (
  <p className="text-sm text-muted-foreground">
    Không tìm thấy sản phẩm trong danh mục này.{' '}
    <button onClick={clearCategory} className="text-primary underline">
      Tìm trong tất cả danh mục
    </button>
  </p>
)}
```

**Note**: `CategoryListing` doesn't currently receive the search query string. Need to either:
- Pass `activeSearch?: string` prop from `ProductsPageContent` → `CategoryListing`
- Or infer from `searchParams` via `useSearchParams()` (already available in the client component)

Since `CategoryListingInner` already uses `useSearchParams()`, read `searchParams.get("q")` directly for the empty-state condition.

## Related Code Files

- Read: `packages/database/src/services/product.server.ts` (getProductsForListing, lines 411–465)
- Modify: `apps/main/components/category/category-listing.tsx` (empty state, ~line 75)
- DB: Run investigation queries via `psql $DATABASE_URL`

## Implementation Steps

1. Run DB investigation queries to identify root cause
2. If slug mismatch: fix category slug in DB or update SubCategoryChips to use correct slug
3. If NULL categoryId: note for admin team to re-categorize products (out of scope for this plan)
4. In `category-listing.tsx` empty state, add contextual "clear category" button when both `q` and `category` params are present and count = 0
5. Test: search "kính" → click "Kính mắt" → should see empty state with "Tìm trong tất cả danh mục" button

## Success Criteria

- [x] Root cause identified (data vs slug mismatch) and documented
- [x] Empty state for category+search combo shows actionable hint (not generic message)
- [x] "Tìm trong tất cả danh mục" button clears category filter and shows search results
- [x] If slug fix applied: category filter returns correct results
- [x] No regressions on normal category browsing

## Risk Assessment

Medium — DB investigation required. Code change is low-risk (additive empty state). Data fix is out-of-scope for code deploy (admin task).

## Unresolved Questions

- Are products intentionally not categorized (admin workflow pending), or is it a data migration gap?
- Should SubCategoryChips clear the search when selecting a category, or preserve it?
