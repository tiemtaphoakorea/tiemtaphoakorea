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
