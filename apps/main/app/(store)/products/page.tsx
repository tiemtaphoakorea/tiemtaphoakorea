export const dynamic = "force-dynamic";

import { getCategories } from "@workspace/database/services/category.server";
import { getProductsForListing } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductFilters } from "@/components/products/listing/product-filters";
import { ProductListingContainer } from "@/components/products/listing/product-listing-container";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm | K-SMART",
  description:
    "Khám phá danh mục mỹ phẩm và đồ gia dụng Hàn Quốc chính hãng tại K-SMART. Chất lượng hàng đầu, giá cả cạnh tranh.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <>
      {/* Header Section (Static Shell) */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <nav className="mb-4 flex items-center gap-2 text-xs text-primary-foreground/60">
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-primary-foreground"
            >
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-primary-foreground">Sản phẩm</span>
          </nav>
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-primary-foreground md:text-3xl">
              Danh mục sản phẩm
            </h1>
            <p className="text-sm leading-relaxed text-primary-foreground/70 md:text-base">
              Khám phá bộ sưu tập những sản phẩm chăm sóc sắc đẹp và đồ gia dụng hàng đầu từ Hàn
              Quốc.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<ProductListingSkeleton />}>
          <ProductListingContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function ProductListingContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const search =
    (resolvedSearchParams.q as string) || (resolvedSearchParams.search as string) || "";
  const categorySlug = (resolvedSearchParams.category as string) || "";
  const sort =
    (resolvedSearchParams.sort as (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT]) ||
    PRODUCT_SORT.LATEST;
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10));
  const parsedLimit = Number.parseInt((resolvedSearchParams.limit as string) || "12", 10);
  const pageSize = [4, 12, 24, 48].includes(parsedLimit) ? parsedLimit : 12;

  const [categories, listing] = await Promise.all([
    getCategories(),
    getProductsForListing({
      search,
      categorySlug,
      sort,
      page,
      limit: pageSize,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <ProductFilters categories={categories} activeCategorySlug={categorySlug} />

      <ProductListingContainer
        pageSize={pageSize}
        currentPage={page}
        activeSort={sort}
        searchQuery={search}
        activeCategorySlug={categorySlug}
        products={listing.products}
        productsCount={listing.total}
      />
    </div>
  );
}

function ProductListingSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Filters Skeleton */}
      <div className="w-full lg:w-64 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
