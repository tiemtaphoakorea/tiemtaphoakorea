---
title: "Admin Panel Bug Fixes - Monkey Test"
status: completed
created: 2026-05-03
completed: 2026-05-03
branch: dev
scope: apps/admin
---

# Admin Panel Bug Fixes — Monkey Test

6 bugs + UX issues identified during monkey test of K-SMART Admin (2026-05-03).

## Context

Monkey test found validation gaps, missing loading states, and an unimplemented global search.
No console JS errors. XSS/SQLi inputs handled correctly.

## Phases

| # | Phase | Status | Effort | Priority |
|---|-------|--------|--------|----------|
| 01 | [Validation Fixes](./phase-01-validation-fixes.md) | completed | 1h | P1 |
| 02 | [Loading Skeletons](./phase-02-loading-skeletons.md) | completed | 1.5h | P2 |
| 03 | [Global Search](./phase-03-global-search.md) | completed | 3h | P2 |

## Bug Map

| # | Bug | Phase | Root Cause |
|---|-----|-------|------------|
| 1 | Store name accepts whitespace-only | 01 | `saveShopInfo` sends without `.trim()` or required check |
| 2 | Tier thresholds accept negative numbers | 01 | HTML `min={0}` bypassed; no JS-side `>= 0` guard |
| 3 | Phone format not validated (customer edit) | 01 | No regex check in customer form save handler |
| 4 | Dashboard/Products blank screen on load | 02 | `loading: () => null` in `dynamic()` — no skeleton shown |
| 5 | Global search non-functional | 03 | Confirmed `{/* visual only for now */}` in layout.tsx:121 |
| 6 | Active banners with no title / broken category ref | 01 | Missing required-field guard in banner save + display fallback |

## Key Files

- `apps/admin/app/(dashboard)/settings/_content.tsx` — shop info + tier save handlers
- `apps/admin/app/(dashboard)/customers/_content.tsx` — customer edit form
- `apps/admin/app/(dashboard)/products/page.tsx` — `loading: () => null`
- `apps/admin/app/(dashboard)/page.tsx` — dashboard `loading: () => null`
- `apps/admin/app/(dashboard)/layout.tsx:118-125` — global search input (visual only)
