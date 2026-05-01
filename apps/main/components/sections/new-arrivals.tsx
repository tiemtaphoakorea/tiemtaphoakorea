"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type FeaturedProduct, ProductCard } from "@/components/products/product-card";

type NewArrivalsProps = {
  products: FeaturedProduct[];
};

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-gray-50/30 py-6 md:py-14 dark:bg-slate-900/10">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-end justify-between md:mb-10">
          <div className="space-y-0.5 md:space-y-1.5">
            <p className="hidden text-xs font-bold uppercase tracking-widest text-primary md:block">
              Mới nhất
            </p>
            <h2 className="text-base font-bold tracking-tight text-foreground md:font-display md:text-3xl md:font-bold lg:text-4xl">
              Hàng mới về
            </h2>
            <p className="text-[11px] text-muted-foreground md:hidden">Vừa cập kệ — săn ngay</p>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-primary md:gap-1.5 md:rounded-full md:border md:border-border md:px-4 md:py-2 md:text-muted-foreground md:transition-all md:hover:border-primary/30 md:hover:bg-secondary md:hover:text-primary cursor-pointer"
          >
            <span className="md:hidden">Xem tất cả →</span>
            <span className="hidden md:inline">Xem tất cả</span>
            <ArrowRight className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:block" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
