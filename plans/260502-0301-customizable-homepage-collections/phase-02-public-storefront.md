# Phase 02 — Public Storefront Refactor

**Goal:** Thay 3 fixed sections (`FeaturedProductsSection`, `BestSellersSection`, `NewArrivalsSection`) bằng 1 dynamic loop render generic `<HomepageCollection>`. Xoá 3 component cũ.

**Depends on:** Phase 1 complete (schema + service + seed).

**Files:**
- Create: `apps/main/components/sections/homepage-collection.tsx`
- Modify: `apps/main/app/(store)/page.tsx`
- Delete: `apps/main/components/sections/best-sellers.tsx`
- Delete: `apps/main/components/sections/featured-products.tsx`
- Delete: `apps/main/components/sections/new-arrivals.tsx`

---

## Task 2.1: Investigate getFeaturedProducts usage outside homepage

- [ ] **Step 1: Grep all callers**

```bash
grep -rn "getFeaturedProducts" \
  /Users/kien.ha/Code/auth_shop_platform/apps \
  /Users/kien.ha/Code/auth_shop_platform/packages \
  --include="*.ts" --include="*.tsx" 2>/dev/null
```

- [ ] **Step 2: Decide fate**

If only `apps/main/app/(store)/page.tsx` uses it → keep service function (no harm), just remove wiring.
If used elsewhere → keep both function + callers untouched.

Document decision inline in commit message of Task 2.3.

---

## Task 2.2: Create generic HomepageCollection component

- [ ] **Step 1: Create the component**

Create `apps/main/components/sections/homepage-collection.tsx`:

```tsx
"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type FeaturedProduct, ProductCard } from "@/components/products/product-card";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

export type HomepageCollectionData = {
  id: string;
  title: string;
  subtitle: string | null;
  iconKey: string | null;
  viewAllUrl: string | null;
  products: FeaturedProduct[];
};

type Props = {
  collection: HomepageCollectionData;
};

export function HomepageCollection({ collection }: Props) {
  if (collection.products.length === 0) return null;

  const iconSrc =
    collection.iconKey && collection.iconKey in GENERATED_ICONS
      ? GENERATED_ICONS[collection.iconKey as keyof typeof GENERATED_ICONS]
      : null;

  const viewAllHref = collection.viewAllUrl ?? PUBLIC_ROUTES.PRODUCTS;

  return (
    <section className="bg-background py-6 md:py-9">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-end justify-between gap-6 md:mb-[18px]">
          <div>
            <h2 className="m-0 inline-flex items-center gap-2.5 text-base font-bold tracking-[-0.02em] text-foreground md:text-2xl md:leading-tight">
              {iconSrc && (
                <GeneratedIcon
                  src={iconSrc}
                  className="hidden h-7 w-7 rounded-lg object-contain md:block"
                />
              )}
              <span>{collection.title}</span>
            </h2>
            {collection.subtitle && (
              <small className="mt-1 block text-[11px] font-normal leading-snug text-muted-foreground md:mt-1.5 md:text-[13px]">
                {collection.subtitle}
              </small>
            )}
          </div>
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary md:gap-1.5 md:text-[13px] cursor-pointer"
          >
            <span className="md:hidden">Xem tất cả →</span>
            <span className="hidden md:inline">Xem tất cả</span>
            <ArrowRight className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:block" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 lg:grid-cols-4">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter @workspace/main typecheck 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/main/components/sections/homepage-collection.tsx
git commit -m "feat(main): add generic HomepageCollection section component"
```

---

## Task 2.3: Refactor homepage page.tsx + delete old sections

- [ ] **Step 1: Read current page.tsx**

Read `apps/main/app/(store)/page.tsx` (already familiar from spec).

- [ ] **Step 2: Replace 3 fixed sections with single loop**

Edit `apps/main/app/(store)/page.tsx`:

Remove imports of `BestSellers`, `FeaturedProducts`, `NewArrivals`, `getBestSellers`, `getFeaturedProducts`, `getNewArrivals`. Add:

```ts
import { getActiveHomepageCollections } from "@workspace/database/services/homepage-collection.server";
import { HomepageCollection } from "@/components/sections/homepage-collection";
```

Remove functions: `FeaturedProductsSection`, `NewArrivalsSection`, `BestSellersSection`, and the `mapProduct` / `safeImage` helpers if no longer referenced (they ARE referenced — keep them, but inline below).

Replace with single resolver:

```tsx
async function HomepageCollectionsSection() {
  const collections = await getActiveHomepageCollections();
  return (
    <>
      {collections.map((c) => (
        <HomepageCollection
          key={c.id}
          collection={{
            id: c.id,
            title: c.title,
            subtitle: c.subtitle,
            iconKey: c.iconKey,
            viewAllUrl: c.viewAllUrl,
            products: c.products.map(mapProduct),
          }}
        />
      ))}
    </>
  );
}
```

Update default export — remove the 3 `<Suspense>` wrappers around old sections, replace with single:

```tsx
export default function Home() {
  return (
    <>
      <MobileGreeting />

      <div className="md:hidden">
        <Hero />
      </div>

      <HeroThreeCol />

      <Suspense fallback={null}>
        <MobileCategoryRailSection />
      </Suspense>

      <TrustStrip />

      <CategoryStripEight />

      <Suspense fallback={<MobileCategoryCardsSkeleton />}>
        <MobileCategoryCardsSection />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <HomepageCollectionsSection />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 3: Delete old section components**

```bash
rm apps/main/components/sections/best-sellers.tsx
rm apps/main/components/sections/featured-products.tsx
rm apps/main/components/sections/new-arrivals.tsx
```

- [ ] **Step 4: Type-check**

```bash
pnpm --filter @workspace/main typecheck 2>&1 | tail -30
```

Expected: 0 errors. If errors point at unused imports in `page.tsx`, remove them.

- [ ] **Step 5: Smoke build**

```bash
pnpm --filter @workspace/main build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 6: Manual smoke test**

```bash
pnpm --filter @workspace/main dev
```

Open `http://localhost:3000`. Verify:
- 3 seeded collections render (Featured will be empty → hidden)
- "Bán chạy nhất" shows 4 products
- "Hàng mới về" shows up to 8 products
- View all link works
- Mobile + desktop both render

- [ ] **Step 7: Commit**

```bash
git add apps/main/app/\(store\)/page.tsx \
        apps/main/components/sections/best-sellers.tsx \
        apps/main/components/sections/featured-products.tsx \
        apps/main/components/sections/new-arrivals.tsx
git commit -m "refactor(main): replace fixed homepage sections with dynamic collections

Remove BestSellers, FeaturedProducts, NewArrivals — homepage now renders
HomepageCollection per active row from homepage_collections table."
```

---

## Phase 2 Done When

- [ ] `HomepageCollection` component renders correctly
- [ ] 3 old section files deleted
- [ ] `apps/main` builds and dev server renders seeded collections
- [ ] Manual smoke test confirms parity with old homepage (best sellers count, new arrivals window)
- [ ] No type errors
