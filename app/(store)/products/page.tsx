import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductFilters } from "@/components/products/listing/product-filters";
import { ProductListingContainer } from "@/components/products/listing/product-listing-container";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_SORT } from "@/lib/constants";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { getCategories } from "@/services/category.server";

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
      <div className="border-primary/10 border-b bg-slate-50/40">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <nav className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
            <Link href={PUBLIC_ROUTES.HOME} className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-semibold">Sản phẩm</span>
          </nav>
          <div className="max-w-2xl space-y-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              Danh mục sản phẩm
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
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
  const pageSize = 4;

  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <ProductFilters categories={categories} activeCategorySlug={categorySlug} />

      <ProductListingContainer
        pageSize={pageSize}
        initialCurrentPage={page}
        initialActiveSort={sort}
        initialSearchQuery={search}
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
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
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
