export const dynamic = "force-dynamic";

import { getTopCategoryCards } from "@workspace/database/services/categoryCard.server";
import { getActiveHomepageCollections } from "@workspace/database/services/homepage-collection.server";
import { getSetting } from "@workspace/database/services/settings.server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryCardsGrid } from "@/components/sections/category-cards-grid";
import { CategoryStripEight } from "@/components/sections/category-strip-eight";
import { Hero } from "@/components/sections/hero";
import { HeroThreeCol } from "@/components/sections/hero-three-col";
import { HomepageCollection } from "@/components/sections/homepage-collection";
import { MobileGreeting } from "@/components/sections/mobile-greeting";
import { TrustStrip } from "@/components/sections/trust-strip";

type HomepageConfig = {
  seo: { title: string; description: string };
};

const DEFAULT_SEO = {
  title: "K-SMART | Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng",
  description:
    "Mua sắm mỹ phẩm, đồ chăm sóc da và gia dụng Hàn Quốc chính hãng tại Việt Nam. Giá tốt, giao hàng nhanh, cam kết chất lượng.",
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSetting<HomepageConfig>("homepage_config");
  const seo = config?.seo;
  return {
    title: seo?.title || DEFAULT_SEO.title,
    description: seo?.description || DEFAULT_SEO.description,
  };
}

function ProductGridSkeleton() {
  return (
    <section className="py-6 md:py-9">
      <div className="container mx-auto px-4">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200 md:h-10 md:w-48" />
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 pt-1 md:gap-3.5 md:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-64 w-[64vw] max-w-[240px] shrink-0 snap-start animate-pulse rounded-2xl bg-gray-200 md:h-80 md:w-[34vw] md:max-w-[280px] lg:w-auto lg:max-w-none"
            />
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
            products: c.products,
          }}
        />
      ))}
    </>
  );
}

export default async function Home() {
  return (
    <>
      <MobileGreeting />

      <div className="md:hidden">
        <Hero />
      </div>
      <HeroThreeCol />

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
