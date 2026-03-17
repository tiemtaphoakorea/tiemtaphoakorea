import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { Hero } from "@/components/sections/hero";
import { getFeaturedProducts } from "@/services/product.server";

export const metadata: Metadata = {
  title: "K-SMART | Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng",
  description:
    "Mua sắm mỹ phẩm, đồ chăm sóc da và gia dụng Hàn Quốc chính hãng tại Việt Nam. Giá tốt, giao hàng nhanh, cam kết chất lượng.",
};

async function FeaturedProductsSection() {
  const rawProducts = await getFeaturedProducts(8);
  const products = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.minPrice || parseFloat(p.basePrice || "0"),
    originalPrice: undefined,
    category: p.categoryName || "Uncategorized",
    image: p.thumbnail || "/placeholder.jpg",
    stock: p.totalStock,
  }));
  return <FeaturedProducts products={products} />;
}

function FeaturedProductsFallback() {
  return (
    <section className="bg-gray-50/30 py-12 dark:bg-slate-900/10">
      <div className="container mx-auto px-4">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-8 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<FeaturedProductsFallback />}>
        <FeaturedProductsSection />
      </Suspense>
    </>
  );
}
