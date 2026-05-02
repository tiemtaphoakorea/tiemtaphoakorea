export const dynamic = "force-dynamic";

import { getCategories } from "@workspace/database/services/category.server";
import { getTopCategoryCards } from "@workspace/database/services/categoryCard.server";
import { getActiveHomepageCollections } from "@workspace/database/services/homepage-collection.server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryCardsGrid } from "@/components/sections/category-cards-grid";
import { CategoryStripEight } from "@/components/sections/category-strip-eight";
import { Hero } from "@/components/sections/hero";
import { HeroThreeCol } from "@/components/sections/hero-three-col";
import { HomepageCollection } from "@/components/sections/homepage-collection";
import { MobileCategoryRail } from "@/components/sections/mobile-category-rail";
import { MobileGreeting } from "@/components/sections/mobile-greeting";
import { TrustStrip } from "@/components/sections/trust-strip";

export const metadata: Metadata = {
  title: "K-SMART | Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng",
  description:
    "Mua sắm mỹ phẩm, đồ chăm sóc da và gia dụng Hàn Quốc chính hãng tại Việt Nam. Giá tốt, giao hàng nhanh, cam kết chất lượng.",
};

// Strip third-party Unsplash URLs (legacy seed data) so broken images don't render.
function safeImage(url: string | null | undefined): string {
  if (!url || url.includes("images.unsplash.com")) return "/placeholder.png";
  return url;
}

function mapProduct(p: any) {
  const minPrice = p.minPrice ?? parseFloat(p.basePrice ?? "0");
  const basePrice = p.basePrice ? parseFloat(p.basePrice) : null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: minPrice,
    originalPrice: basePrice && basePrice > minPrice ? basePrice : undefined,
    category: p.categoryName || "Uncategorized",
    image: safeImage(p.thumbnail),
    stock: p.totalStock,
  };
}

function ProductGridSkeleton() {
  return (
    <section className="py-6 md:py-9">
      <div className="container mx-auto px-4">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200 md:h-10 md:w-48" />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200 md:h-80" />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileCategoryCardsSkeleton() {
  return (
    <div className="container mx-auto mt-6 px-4 md:hidden">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

async function MobileCategoryRailSection() {
  const cats = await getCategories({ navOnly: true });
  const items = cats
    .filter((c) => c.isActive)
    .slice(0, 8)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  return <MobileCategoryRail categories={items} />;
}

async function MobileCategoryCardsSection() {
  const cards = await getTopCategoryCards(4);
  return (
    <div className="container mx-auto px-4 md:hidden">
      <CategoryCardsGrid cards={cards} />
    </div>
  );
}

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

export default function Home() {
  return (
    <>
      <MobileGreeting />

      {/* Mobile hero (carousel) */}
      <div className="md:hidden">
        <Hero />
      </div>

      {/* Desktop hero — 3-col layout (categories + banner + mini banners) */}
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
