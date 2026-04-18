# Homepage Product Sections — Design Spec

**Date:** 2026-04-18  
**Status:** Approved

## Goal

Add multiple product listing sections to the homepage (currently only shows "Sản phẩm được yêu thích"). The new homepage will have 5 sections stacked vertically, each independently loaded.

## Layout

```
Hero (existing)
Category Cards Grid       ← existing component, now wired to homepage
Featured Products         ← existing section (isFeatured=true), 8 products
New Arrivals              ← new section, getNewArrivals(), 8 products
Best Sellers              ← new section, getBestSellers(), 8 products
```

## Components

### Shared ProductCard

**Extract** `ProductCard` component and `FeaturedProduct` type from `apps/main/components/sections/featured-products.tsx` into a new shared file:

- **File:** `apps/main/components/products/product-card.tsx`
- Exports: `ProductCard`, `FeaturedProduct` type
- `featured-products.tsx` imports from this file instead of defining locally
- All new sections reuse the same card

### Category Cards Section (apps/main/app/(store)/page.tsx)

- Fetch from existing `getCategoryCards()` (admin-configurable)
- Use existing `CategoryCardsGrid` component
- Placed immediately after Hero
- Wrapped in `<Suspense>` with skeleton fallback (4 placeholder boxes)

### New Arrivals Section

- **Component:** `apps/main/components/sections/new-arrivals.tsx`
- Query: `getNewArrivals(8)` — already exists in `product.server.ts`
- Header label: "Mới nhất" / title: "Hàng mới về"
- Same grid layout as FeaturedProducts (2/3/4 cols)
- "Xem tất cả" links to `/products`
- Wrapped in `<Suspense>` with same skeleton fallback pattern

### Best Sellers Section

- **Component:** `apps/main/components/sections/best-sellers.tsx`
- Query: `getBestSellers(limit)` — **new function** to add in `product.server.ts`
- Header label: "Phổ biến" / title: "Bán chạy nhất"
- Same grid layout as other sections
- "Xem tất cả" links to `/products`
- Wrapped in `<Suspense>` with same skeleton fallback pattern

## New DB Query: getBestSellers

Add to `packages/database/src/services/product.server.ts`:

```ts
export async function getBestSellers(limit = FEATURED_PRODUCTS_LIMIT_DEFAULT) {
  // Join order_items → products, group by productId, order by sum(quantity) DESC
  // Only active products
  // Returns ProductListItem shape (same as getFeaturedProducts)
}
```

Uses `orderItems` table (already imported in the file). Returns products sorted by total units sold across all orders.

## Data Flow

Each section is a separate `async` Server Component called inside `page.tsx`, each wrapped in its own `<Suspense>`. All 4 DB queries fire in parallel (Next.js parallel data fetching). Each has an independent skeleton fallback so sections load independently.

## Files to Create / Modify

| File | Action |
|------|--------|
| `apps/main/components/products/product-card.tsx` | Create — shared ProductCard |
| `apps/main/components/sections/featured-products.tsx` | Modify — import ProductCard from shared file |
| `apps/main/components/sections/new-arrivals.tsx` | Create — NewArrivals section |
| `apps/main/components/sections/best-sellers.tsx` | Create — BestSellers section |
| `packages/database/src/services/product.server.ts` | Modify — add getBestSellers() |
| `apps/main/app/(store)/page.tsx` | Modify — wire all sections + Suspense |

## Out of Scope

- Personalisation or user-based recommendations
- Infinite scroll or pagination on homepage sections
- Admin toggle to show/hide sections (can be added later)
