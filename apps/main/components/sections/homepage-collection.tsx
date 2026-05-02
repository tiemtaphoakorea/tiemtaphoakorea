"use client";

import type { ProductListItem } from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";
import { normalizeStorefrontHref } from "./normalize-storefront-href";

export type HomepageCollectionData = {
  id: string;
  title: string;
  subtitle: string | null;
  iconKey: string | null;
  viewAllUrl: string | null;
  products: ProductListItem[];
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

  const viewAllHref = normalizeStorefrontHref(collection.viewAllUrl ?? PUBLIC_ROUTES.PRODUCTS);

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
            className="group inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary md:gap-1.5 md:text-[13px]"
          >
            <span className="md:hidden">Xem tất cả →</span>
            <span className="hidden md:inline">Xem tất cả</span>
            <ArrowRight className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:block" />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 pt-1 md:gap-3.5 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
          {collection.products.map((product, i) => (
            <div
              key={product.id}
              className="w-[64vw] max-w-[240px] shrink-0 snap-start md:w-[34vw] md:max-w-[280px] lg:w-auto lg:max-w-none"
            >
              <ProductCard product={product} priority={i < 4} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
