# Project Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [2026-05-03] - Admin Panel Bug Fixes

### Fixed
- **Validation Fixes (Phase 01)**
  - Store name validation: Added `.trim()` guard + empty check in `saveShopInfo()` to prevent saving whitespace-only names
  - Tier threshold validation: Added explicit JS-level guards (`< 1` for min orders, `< 0` for min spend) in addition to HTML `min=` attribute to prevent negative/zero values
  - Solution: Modified `apps/admin/app/(dashboard)/settings/_content.tsx` with comprehensive validation before API calls

- **Loading State Skeletons (Phase 02)**
  - Dashboard and product pages showed blank white screen on initial load
  - Created reusable `PageSkeleton` component at `apps/admin/components/layout/page-skeleton.tsx`
  - Updated 27 admin pages to show skeleton loading state instead of `null`
  - All dynamic-imported pages now display: header skeleton + 8 table row skeletons during content load

- **Global Search Functionality (Phase 03)**
  - Implemented fully functional global search in admin header (previously placeholder-only)
  - Created `GlobalSearch` component at `apps/admin/components/layout/global-search.tsx` with:
    - 300ms debounce, minimum 2 non-whitespace characters
    - Parallel queries to products, orders, customers endpoints (max 4 results each)
    - Grouped dropdown (Sản phẩm / Đơn hàng / Khách hàng)
    - Full keyboard navigation (Arrow/Enter/Escape)
    - HTTP error handling and ARIA accessibility attributes
  - Modified `apps/admin/app/(dashboard)/layout.tsx` to replace placeholder input with functional component

### Technical Details
- **Files Modified**: 30 total
  - `apps/admin/app/(dashboard)/settings/_content.tsx` (validation)
  - `apps/admin/components/layout/global-search.tsx` (new)
  - `apps/admin/components/layout/page-skeleton.tsx` (new)
  - All 27 admin page.tsx files in `apps/admin/app/(dashboard)/**/*.tsx`
  - `apps/admin/app/(dashboard)/layout.tsx` (global search integration)

- **Scope**: Admin panel only (`apps/admin`)
- **Branch**: dev
- **No breaking changes** — all fixes are backward-compatible client-side guards
- **Test Status**: TypeScript compilation: 0 errors

## Previous Releases
[To be populated as more releases occur]
