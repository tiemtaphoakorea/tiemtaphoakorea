---
title: "Fix Medium Bugs - Main App Monkey Test"
status: completed
created: 2026-05-03
completed: 2026-05-03
branch: dev
scope: apps/main
---

# Fix Medium Bugs — Main App Monkey Test

4 phased bug fixes identified during monkey test of K-SMART main storefront.

## Context

Monkey test (2026-05-03) found 5 medium bugs. Critical bugs (price=0đ, hydration ×4, no add-to-cart) are tracked separately. This plan covers medium-priority UX/UI bugs only.

## Phases

| # | Phase | Status | Effort | Priority |
|---|-------|--------|--------|----------|
| 01 | [UI Quick Fixes](./phase-01-ui-quick-fixes.md) | completed | 1h | P1 |
| 02 | [Variant Gallery Fallback](./phase-02-variant-gallery-fallback.md) | completed | 1h | P2 |
| 03 | [Homepage Blank Space](./phase-03-homepage-blank-space.md) | completed | 1h | P2 |
| 04 | [Category + Search Filter](./phase-04-category-search-filter.md) | completed | 1h | P2 |

## Bug Map

| Bug | Phase | Root Cause |
|-----|-------|------------|
| Sort dropdown blank on /product initial load | 01 | `<SelectValue />` no placeholder, hydration gap |
| Filter panel category counts show 0 | 01 | `count={cat.children?.length}` ≠ product count |
| Product detail extra blank white space | 01 | Duplicate `min-h-screen` on page wrapper |
| Variant image doesn't update when switching | 02 | No image fallback when selected variant has no images |
| Homepage blank white space when scrolling | 03 | Investigate section heights / lazy-load gaps |
| Category + search combined = 0 results | 04 | Products not assigned to category in DB OR slug mismatch |

## Key Files

- `apps/main/components/category/category-toolbar.tsx` — sort dropdown
- `apps/main/components/category/category-sidebar.tsx` — filter panel
- `apps/main/app/(store)/product/[slug]/page.tsx` — product detail wrapper
- `apps/main/components/products/detail/product-client-container.tsx` — variant/gallery state
- `apps/main/app/(store)/page.tsx` — homepage sections
- `apps/main/components/products/listing/sub-category-chips.tsx` — category chips

## Cook Command

```bash
/ck:cook /Users/kien.ha/Code/auth_shop_platform/plans/260503-1025-main-medium-bug-fixes/plan.md
```
