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
