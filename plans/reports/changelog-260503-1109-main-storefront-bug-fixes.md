---
id: CHANGELOG-260503
date: 2026-05-03
version: v1.2.1
type: bug-fixes
scope: main-storefront
severity: medium
---

# Main Storefront Bug Fixes - 2026-05-03

**Release Version**: v1.2.1  
**Date**: May 3, 2026  
**Status**: Deployed  
**Scope**: Main storefront UI/UX improvements and layout fixes

## Summary

Six targeted bug fixes and UX improvements across the main storefront, addressing UI interaction issues, layout problems, and missing components. All fixes are non-breaking and enhance user experience without altering core functionality.

## Changes

### 1. Category Toolbar - Select Value Placeholder
**Type**: UI Fix  
**File**: `apps/main/app/(store)/_components/category-toolbar.tsx`  
**Issue**: SelectValue component lacked placeholder text, creating visual ambiguity  
**Fix**: Added placeholder prop to SelectValue for improved UI clarity  
**Impact**: Better UX guidance when category filter is unselected  
**Status**: ✅ Deployed

### 2. Category Sidebar - Remove Misleading Count Display
**Type**: UI Fix  
**File**: `apps/main/app/(store)/_components/category-sidebar.tsx`  
**Issue**: Count display could be misleading when filters were applied  
**Fix**: Removed count display from category sidebar  
**Impact**: Cleaner UI and prevents user confusion  
**Status**: ✅ Deployed

### 3. Product Detail Page - Remove Redundant min-h-screen
**Type**: Layout Fix  
**File**: `apps/main/app/(store)/products/[handle]/page.tsx`  
**Issue**: Redundant `min-h-screen` CSS class creating unwanted vertical spacing  
**Fix**: Removed unnecessary height constraint  
**Impact**: More natural layout flow, better responsive behavior  
**Status**: ✅ Deployed

### 4. Product Client Container - Image Fallback Chain
**Type**: UX Fix  
**File**: `apps/main/app/(store)/_components/product-client-container.tsx`  
**Issue**: Missing images caused broken image display  
**Fix**: Added fallback chain for missing product images  
**Impact**: Graceful degradation when images unavailable  
**Status**: ✅ Deployed

### 5. Store Layout - Add NewsletterCta Before Footer
**Type**: Feature Completion  
**File**: `apps/main/app/(store)/layout.tsx`  
**Issue**: Newsletter subscription section missing on desktop (existed only on some pages)  
**Fix**: Added NewsletterCta component to store layout wrapper  
**Impact**: Consistent newsletter signup placement across all storefront pages  
**Status**: ✅ Deployed

### 6. Category Listing - Contextual Empty State
**Type**: UX Improvement  
**File**: `apps/main/app/(store)/categories/page.tsx`  
**Issue**: No contextual feedback when search + category filter returned no results  
**Fix**: Added empty-state component for combined filter scenarios  
**Impact**: Better user guidance when no products match filters  
**Status**: ✅ Deployed

## Testing

All fixes verified via:
- Manual QA testing (screenshot validation)
- Browser compatibility check (desktop/mobile)
- No regression in related components
- Visual comparison against design specs

**Test Report**: `tester-260503-1107-main-storefront-testing.md`

## Migration Notes

No breaking changes. These are backward-compatible fixes.

## Next Steps

- Monitor user feedback for edge cases
- Consider adding analytics tracking for empty-state interactions
- Track newsletter CTA click-through rate from new layout position

## Related Plans

- Plan: `260503-1025-main-medium-bug-fixes`
  - Phase 01: UI Quick Fixes
  - Phase 02: Variant Gallery Fallback
  - Phase 03: Homepage Blank Space
  - Phase 04: Category Search Filter
