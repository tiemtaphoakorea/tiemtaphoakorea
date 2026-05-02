"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type FeaturedProduct, ProductCard } from "@/components/products/product-card";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

export type { FeaturedProduct };

type FeaturedProductsProps = {
  products: FeaturedProduct[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section
      id="featured-products"
      data-testid="featured-products"
      className="bg-background py-6 md:py-9"
    >
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-end justify-between gap-6 md:mb-[18px]">
          <div>
            <h2 className="m-0 inline-flex items-center gap-2.5 text-base font-bold tracking-[-0.02em] text-foreground md:text-2xl md:leading-tight">
              <GeneratedIcon
                src={GENERATED_ICONS.flash}
                className="hidden h-7 w-7 rounded-lg object-contain md:block"
              />
              <span>Hàng hot tuần này</span>
            </h2>
            <small className="mt-1 block text-[11px] font-normal leading-snug text-muted-foreground md:mt-1.5 md:text-[13px]">
              Khách shop đặt nhiều nhất 7 ngày qua
            </small>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="group inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary md:gap-1.5 md:text-[13px] cursor-pointer"
          >
            <span className="md:hidden">Xem tất cả →</span>
            <span className="hidden md:inline">Xem tất cả</span>
            <ArrowRight className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:block" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5 lg:grid-cols-5">
          {products.slice(0, 5).map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
