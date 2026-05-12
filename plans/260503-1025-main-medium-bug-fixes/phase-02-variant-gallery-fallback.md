---
phase: 2
title: "Variant Gallery Fallback"
status: completed
priority: P2
effort: "1h"
dependencies: []
---

# Phase 02: Variant Gallery Fallback

## Overview

When user switches to a variant that has no uploaded images, the gallery falls back to `/placeholder.png` instead of showing the primary variant's images. Fix by adding a fallback image chain.

## Root Cause

**File**: `apps/main/components/products/detail/product-client-container.tsx`

Current logic:
```ts
const images = selectedVariant?.images.map((img) => img.imageUrl) || [];
```

- If selected variant has no images → `images = []`
- `ProductGallery` receives `images=[]` → uses `safeImages = ["/placeholder.png"]`
- `key={selectedVariantId}` forces gallery remount → shows placeholder instead of any real image

Observed: switching from "LACTEA C1 - Black" to "LACTEA C3 - AMBER" shows either placeholder or stale image, as AMBER variant has no images in DB.

## Fix

Apply a fallback chain in `product-client-container.tsx`:
1. Use selected variant images if available
2. Else fall back to first variant's images
3. Else empty array (gallery handles with placeholder)

```ts
// Before
const images = selectedVariant?.images.map((img) => img.imageUrl) || [];

// After
const selectedVariantImages = selectedVariant?.images?.map((img) => img.imageUrl) ?? [];
const fallbackImages = product.variants[0]?.images?.map((img) => img.imageUrl) ?? [];
const images = selectedVariantImages.length > 0 ? selectedVariantImages : fallbackImages;
```

This ensures users always see a relevant image rather than a generic placeholder when switching variants.

## Related Code Files

- Modify: `apps/main/components/products/detail/product-client-container.tsx` (images computation, ~line 18)

## Implementation Steps

1. Open `product-client-container.tsx`
2. Replace the `images` computation with the fallback chain above
3. Verify TypeScript compiles — `product.variants[0]?.images` shape must match `selectedVariant?.images`
4. Manually test: navigate to a product with multiple variants where one has no images, switch variants — should show first variant's images not placeholder

## Success Criteria

- [x] Switching to a variant with no images shows first variant's images (not placeholder)
- [x] Switching to a variant WITH images still shows that variant's correct images
- [x] `key={selectedVariantId}` on gallery still forces correct remount
- [x] No TypeScript errors

## Risk Assessment

Low. Purely additive fallback — doesn't change behavior when variant has images.
