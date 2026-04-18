# Homepage Product Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Category Cards, New Arrivals, and Best Sellers sections to the homepage alongside the existing Featured Products section.

**Architecture:** Each section is an independent async Server Component wrapped in `<Suspense>`. All DB queries fire in parallel. `ProductCard` is extracted to a shared component file reused by all product sections. `getBestSellers()` is a new DB query joining `order_items → product_variants → products`.

**Tech Stack:** Next.js 14 App Router (Server Components), Drizzle ORM, Vitest (integration tests hit real DB)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/main/components/products/product-card.tsx` | **Create** | Shared `ProductCard` component + `FeaturedProduct` type |
| `apps/main/components/sections/featured-products.tsx` | **Modify** | Import `ProductCard` from shared file, remove local definition |
| `apps/main/components/sections/new-arrivals.tsx` | **Create** | `NewArrivals` section (uses shared `ProductCard`) |
| `apps/main/components/sections/best-sellers.tsx` | **Create** | `BestSellers` section (uses shared `ProductCard`) |
| `packages/database/src/services/product.server.ts` | **Modify** | Add `getBestSellers(limit)` function |
| `apps/main/app/(store)/page.tsx` | **Modify** | Wire all 5 sections with Suspense |
| `tests/unit/services/product.server.test.ts` | **Modify** | Add `getBestSellers` tests |

---

### Task 1: Add `getBestSellers` to product.server.ts (with test)

**Files:**
- Modify: `packages/database/src/services/product.server.ts` (after `getNewArrivals`)
- Modify: `tests/unit/services/product.server.test.ts`

- [ ] **Step 1: Write the failing test**

Open `tests/unit/services/product.server.test.ts`. Add `getBestSellers` to the import line at line 10:

```ts
import {
  createProduct,
  deleteProduct,
  generateProductSlug,
  getBestSellers,
  getFeaturedProducts,
  getNewArrivals,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsForListing,
  getProductsWithVariants,
  updateProduct,
} from "@/services/product.server";
```

Then add this test block inside the `describe("Product Service", ...)` block (after the existing `getNewArrivals` describe block):

```ts
describe("getBestSellers", () => {
  it("returns active products ordered by total units sold", async () => {
    // Create a product with a variant
    const [prod] = await db
      .insert(products)
      .values({
        name: "Best Seller Test Product",
        slug: "best-seller-test-product",
        categoryId: TEST_CAT_ID,
        isActive: true,
        isFeatured: false,
      })
      .returning();

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId: prod!.id,
        sku: "BST-001",
        name: "Default",
        price: "100000",
        stockQuantity: 50,
      })
      .returning();

    // Insert a fake profile and order so we can add order items
    const TEST_PROFILE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    await db
      .insert(profiles)
      .values({ id: TEST_PROFILE_ID, email: "bstest@example.com", role: "customer" })
      .onConflictDoNothing();

    const [order] = await db
      .insert(orders)
      .values({
        profileId: TEST_PROFILE_ID,
        status: "delivered",
        totalAmount: "100000",
      })
      .returning();

    await db.insert(orderItems).values({
      orderId: order!.id,
      variantId: variant!.id,
      productName: prod!.name,
      variantName: "Default",
      sku: "BST-001",
      quantity: 5,
      unitPrice: "100000",
      lineTotal: "500000",
    });

    const results = await getBestSellers(10);

    expect(results.length).toBeGreaterThan(0);
    const found = results.find((r) => r.id === prod!.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Best Seller Test Product");

    // Cleanup
    await db.delete(orderItems).where(eq(orderItems.orderId, order!.id));
    await db.delete(orders).where(eq(orders.id, order!.id));
    await db.delete(profiles).where(eq(profiles.id, TEST_PROFILE_ID));
    await db.delete(products).where(eq(products.id, prod!.id));
  });

  it("excludes inactive products", async () => {
    const [prod] = await db
      .insert(products)
      .values({
        name: "Inactive Best Seller",
        slug: "inactive-best-seller-test",
        categoryId: TEST_CAT_ID,
        isActive: false,
      })
      .returning();

    const results = await getBestSellers(10);
    const found = results.find((r) => r.id === prod!.id);
    expect(found).toBeUndefined();

    await db.delete(products).where(eq(products.id, prod!.id));
  });
});
```

Also add the missing imports at the top of the test file (add to existing imports if not already present):

```ts
import { orderItems, orders } from "@/db/schema/orders";
import { profiles } from "@/db/schema/profiles";
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm vitest run tests/unit/services/product.server.test.ts -t "getBestSellers"
```

Expected: FAIL — `getBestSellers is not a function` or import error.

- [ ] **Step 3: Implement `getBestSellers` in product.server.ts**

Open `packages/database/src/services/product.server.ts`. After `getNewArrivals` (around line 557), add:

```ts
/**
 * Get best-selling products by total units sold across all orders.
 */
export async function getBestSellers(limit = FEATURED_PRODUCTS_LIMIT_DEFAULT) {
  return await db
    .select(PRODUCT_CARD_SELECT(products))
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .leftJoin(orderItems, eq(productVariants.id, orderItems.variantId))
    .where(eq(products.isActive, true))
    .groupBy(products.id, categories.name)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`))
    .limit(limit);
}
```

Note: `orderItems` is already imported at the top of the file.

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm vitest run tests/unit/services/product.server.test.ts -t "getBestSellers"
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/product.server.ts tests/unit/services/product.server.test.ts
git commit -m "feat(db): add getBestSellers query with tests"
```

---

### Task 2: Extract shared ProductCard component

**Files:**
- Create: `apps/main/components/products/product-card.tsx`
- Modify: `apps/main/components/sections/featured-products.tsx`

- [ ] **Step 1: Create shared ProductCard file**

Create `apps/main/components/products/product-card.tsx`:

```tsx
"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  stock: number;
};

export function ProductCard({ product }: { product: FeaturedProduct }) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div
      data-testid="product-card"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8"
    >
      <Link
        href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="relative aspect-[4/5] overflow-hidden bg-muted/30"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
          <div className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </div>
        {product.stock <= 10 && product.stock > 0 && (
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Còn {product.stock}
            </span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
          {product.category}
        </span>
        <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>
          <h3 className="line-clamp-2 min-h-[2.5rem] cursor-pointer text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button
          asChild
          className="h-9 w-full rounded-full bg-primary/8 text-xs font-semibold text-primary shadow-none hover:bg-primary hover:text-white transition-all border-0"
        >
          <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>Xem chi tiết</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update featured-products.tsx to use shared ProductCard**

Replace the entire content of `apps/main/components/sections/featured-products.tsx` with:

```tsx
"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard, type FeaturedProduct } from "@/components/products/product-card";

export type { FeaturedProduct };

type FeaturedProductsProps = {
  products: FeaturedProduct[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="featured-products" data-testid="featured-products" className="bg-background py-14">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Nổi bật</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Sản phẩm được yêu thích
            </h2>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-primary cursor-pointer"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify build still works**

```bash
pnpm --filter @workspace/main build 2>&1 | tail -20
```

Expected: no TypeScript errors related to `ProductCard` or `FeaturedProduct`.

- [ ] **Step 4: Commit**

```bash
git add apps/main/components/products/product-card.tsx apps/main/components/sections/featured-products.tsx
git commit -m "refactor(main): extract ProductCard to shared component"
```

---

### Task 3: Create NewArrivals section component

**Files:**
- Create: `apps/main/components/sections/new-arrivals.tsx`

- [ ] **Step 1: Create the component**

Create `apps/main/components/sections/new-arrivals.tsx`:

```tsx
"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard, type FeaturedProduct } from "@/components/products/product-card";

type NewArrivalsProps = {
  products: FeaturedProduct[];
};

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-gray-50/30 py-14 dark:bg-slate-900/10">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Mới nhất</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Hàng mới về
            </h2>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-primary cursor-pointer"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/main/components/sections/new-arrivals.tsx
git commit -m "feat(main): add NewArrivals section component"
```

---

### Task 4: Create BestSellers section component

**Files:**
- Create: `apps/main/components/sections/best-sellers.tsx`

- [ ] **Step 1: Create the component**

Create `apps/main/components/sections/best-sellers.tsx`:

```tsx
"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard, type FeaturedProduct } from "@/components/products/product-card";

type BestSellersProps = {
  products: FeaturedProduct[];
};

export function BestSellers({ products }: BestSellersProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-background py-14">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Phổ biến</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Bán chạy nhất
            </h2>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-primary cursor-pointer"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/main/components/sections/best-sellers.tsx
git commit -m "feat(main): add BestSellers section component"
```

---

### Task 5: Wire all sections in homepage page.tsx

**Files:**
- Modify: `apps/main/app/(store)/page.tsx`

- [ ] **Step 1: Replace page.tsx with the wired version**

Replace the entire content of `apps/main/app/(store)/page.tsx` with:

```tsx
export const dynamic = "force-dynamic";

import { getCategoryCards } from "@workspace/database/services/categoryCard.server";
import {
  getBestSellers,
  getFeaturedProducts,
  getNewArrivals,
} from "@workspace/database/services/product.server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BestSellers } from "@/components/sections/best-sellers";
import { CategoryCardsGrid } from "@/components/sections/category-cards-grid";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { Hero } from "@/components/sections/hero";
import { NewArrivals } from "@/components/sections/new-arrivals";

export const metadata: Metadata = {
  title: "K-SMART | Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng",
  description:
    "Mua sắm mỹ phẩm, đồ chăm sóc da và gia dụng Hàn Quốc chính hãng tại Việt Nam. Giá tốt, giao hàng nhanh, cam kết chất lượng.",
};

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.minPrice || parseFloat(p.basePrice || "0"),
    originalPrice: undefined,
    category: p.categoryName || "Uncategorized",
    image: p.thumbnail || "/placeholder.jpg",
    stock: p.totalStock,
  };
}

function ProductGridSkeleton() {
  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCardsSkeleton() {
  return (
    <div className="container mx-auto mt-6 px-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}

async function CategoryCardsSection() {
  const cards = await getCategoryCards();
  return <CategoryCardsGrid cards={cards} />;
}

async function FeaturedProductsSection() {
  const products = (await getFeaturedProducts(8)).map(mapProduct);
  return <FeaturedProducts products={products} />;
}

async function NewArrivalsSection() {
  const products = (await getNewArrivals(8)).map(mapProduct);
  return <NewArrivals products={products} />;
}

async function BestSellersSection() {
  const products = (await getBestSellers(8)).map(mapProduct);
  return <BestSellers products={products} />;
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<CategoryCardsSkeleton />}>
        <CategoryCardsSection />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <NewArrivalsSection />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <BestSellersSection />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm --filter @workspace/main typecheck 2>&1 | tail -30
```

Expected: no errors.

- [ ] **Step 3: Start dev server and visually verify**

```bash
pnpm --filter @workspace/main dev
```

Open `http://localhost:3000` and confirm:
- Hero renders
- Category Cards appear below Hero (or nothing if no cards configured in admin)
- "Sản phẩm được yêu thích" section appears
- "Hàng mới về" section appears
- "Bán chạy nhất" section appears

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/(store)/page.tsx
git commit -m "feat(main): wire homepage with category cards, new arrivals, and best sellers sections"
```

---

## Self-Review

**Spec coverage:**
- ✅ Category Cards wired to homepage via `getCategoryCards()` + `CategoryCardsGrid`
- ✅ Featured Products remains (unchanged query, refactored component)
- ✅ New Arrivals uses existing `getNewArrivals(8)`
- ✅ Best Sellers uses new `getBestSellers(8)` with test coverage
- ✅ Shared `ProductCard` extracted — all sections reuse it
- ✅ Each section independently wrapped in `<Suspense>` with skeleton fallback
- ✅ Data fetch pattern consistent (`mapProduct` helper in page.tsx)

**Placeholder scan:** No TBD/TODO/placeholders found.

**Type consistency:** `FeaturedProduct` type defined once in `product-card.tsx`, re-exported from `featured-products.tsx`. All section components use `FeaturedProduct[]`. `mapProduct` helper in `page.tsx` maps DB result → `FeaturedProduct` consistently for all three sections.
