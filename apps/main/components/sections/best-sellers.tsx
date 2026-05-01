"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type FeaturedProduct, ProductCard } from "@/components/products/product-card";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

type BestSellersProps = {
  products: FeaturedProduct[];
};

export function BestSellers({ products }: BestSellersProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-background py-6 md:py-9">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-end justify-between gap-6 md:mb-[18px]">
          <div>
            <h2 className="m-0 inline-flex items-center gap-2.5 text-base font-bold tracking-[-0.02em] text-foreground md:text-2xl md:leading-tight">
              <GeneratedIcon
                src={GENERATED_ICONS.beauty}
                className="hidden h-7 w-7 rounded-lg object-cover md:block"
              />
              <span>Bán chạy nhất</span>
            </h2>
            <small className="mt-1 block text-[11px] font-normal leading-snug text-muted-foreground md:mt-1.5 md:text-[13px]">
              Sản phẩm được khách hàng chọn mua nhiều nhất
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
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
