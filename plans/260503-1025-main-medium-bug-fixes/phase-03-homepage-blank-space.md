---
phase: 3
title: "Homepage Blank Space"
status: completed
priority: P2
effort: "1h"
dependencies: [1]
---

# Phase 03: Homepage Blank Space

## Overview

Large blank white areas appear when scrolling the homepage and static pages (order-lookup, product detail). Phase 01 fixes product detail. This phase investigates and fixes the homepage scroll blank space.

## Root Cause Analysis

Observed blank spaces occur at 2 points during homepage scroll:
1. Between the hero banner + trust badges section and the product grid sections
2. Between product sections and the newsletter/footer

Likely causes (inspect in order):
- A section component rendering a tall empty container (e.g. when data is empty/loading)
- A `min-h-*` or fixed height class on a section that isn't removed when content is absent
- A `Suspense` fallback skeleton that renders with a fixed height and doesn't collapse when resolved

## Investigation Steps

1. Open Chrome DevTools on `http://localhost:3000`
2. Inspect the blank areas with Element Inspector → identify which DOM element is causing the height
3. Check `apps/main/app/(store)/page.tsx` — identify all homepage sections
4. For each section component in `apps/main/components/sections/`, check:
   - Fixed height classes (`h-[Xpx]`, `min-h-[Xpx]`)
   - Conditional rendering that might leave wrapper divs with height
   - Suspense fallbacks with height that don't collapse

## Related Code Files

- Read: `apps/main/app/(store)/page.tsx`
- Read: `apps/main/components/sections/*.tsx` (all section files)
- Modify: whichever section(s) are identified as the cause

## Implementation Steps

1. Identify culprit section(s) via DevTools inspection
2. Remove or conditionally apply the height class:
   - If empty state: don't render the wrapper, or use `h-auto` instead of fixed height
   - If Suspense fallback: ensure fallback has `min-h-0` or no fixed height when data resolves
3. Verify: scroll full homepage — no blank areas between sections
4. Check order-lookup and other static pages for the same pattern

## Success Criteria

- [x] Homepage scrolls smoothly with no blank white areas
- [x] Static pages (order-lookup, shipping, returns) have no bottom blank space
- [x] Section content fills its container naturally without extra whitespace
- [x] No regressions in section layout on desktop viewport

## Risk Assessment

Medium — CSS changes to shared section components could affect layout on other viewports. Test on both mobile (375px) and desktop (1280px) after fix.
