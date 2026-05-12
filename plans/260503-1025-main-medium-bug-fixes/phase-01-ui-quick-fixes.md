---
phase: 1
title: "UI Quick Fixes"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 01: UI Quick Fixes

## Overview

3 one-liner fixes: sort dropdown blank label, misleading category counts in filter panel, duplicate `min-h-screen` causing blank space on product detail page.

## Root Causes

### Bug A — Sort dropdown blank on `/product` initial load
- **File**: `apps/main/components/category/category-toolbar.tsx`
- `<SelectValue />` has no `placeholder` prop
- During Suspense hydration window → Select renders before value resolves → blank label
- Fix: add `placeholder="Sắp xếp"` to `<SelectValue>`

### Bug B — Filter panel category counts show 0
- **File**: `apps/main/components/category/category-sidebar.tsx`
- `count={cat.children?.length}` passes number of sub-categories, not product count
- Categories (Kính mắt, Mỹ phẩm, Thực phẩm chức năng) have no children → shows 0
- Misleads users into thinking the category is empty
- Fix: remove `count` prop from `CategoryCheckbox` calls — there's no server-side product count available in the current data shape

### Bug C — Product detail extra blank space
- **File**: `apps/main/app/(store)/product/[slug]/page.tsx`
- Store layout already has `min-h-screen` on outer wrapper (`layout.tsx:44`)
- Product detail page adds a second `<div className="bg-background min-h-screen pb-24">`
- Double `min-h-screen` → page is always at least 200vh tall → blank white area at bottom
- Fix: remove `min-h-screen` from product page wrapper div

## Implementation Steps

1. **`category-toolbar.tsx`** — add placeholder to SelectValue:
   ```tsx
   // Before
   <SelectValue />
   // After
   <SelectValue placeholder="Sắp xếp" />
   ```

2. **`category-sidebar.tsx`** — remove count from category checkboxes:
   ```tsx
   // Before
   <CategoryCheckbox count={cat.children?.length} ... />
   // After
   <CategoryCheckbox ... />
   ```
   Also remove the `count` prop from the "Tất cả sản phẩm" checkbox if present.

3. **`app/(store)/product/[slug]/page.tsx`** — remove duplicate min-h-screen:
   ```tsx
   // Before
   <div className="bg-background min-h-screen pb-24">
   // After
   <div className="pb-24">
   ```

## Related Code Files

- Modify: `apps/main/components/category/category-toolbar.tsx` (line ~60: `<SelectValue />`)
- Modify: `apps/main/components/category/category-sidebar.tsx` (CategoryCheckbox calls with count)
- Modify: `apps/main/app/(store)/product/[slug]/page.tsx` (line 25: wrapper div className)

## Success Criteria

- [x] Sort dropdown shows "Sắp xếp" placeholder or correct label on `/product` page load
- [x] Filter panel no longer shows 0 next to category names
- [x] Product detail page bottom blank space gone — page ends naturally after content
- [x] No TypeScript/build errors

## Risk Assessment

Low risk — all are purely cosmetic/CSS/prop changes with no logic impact.
