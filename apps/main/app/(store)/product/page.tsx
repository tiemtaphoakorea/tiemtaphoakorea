export const dynamic = "force-dynamic";

import { getCategories } from "@workspace/database/services/category.server";
import { getProductsForListing } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterProvider } from "@/components/category/category-filter-context";
import { CategoryHero } from "@/components/category/category-hero";
import { CategoryListing } from "@/components/category/category-listing";
import { CategorySidebar } from "@/components/category/category-sidebar";
import { SubCategoryChips } from "@/components/products/listing/sub-category-chips";

const PRODUCTS_BASE_PATH = PUBLIC_ROUTES.PRODUCTS;

export const metadata: Metadata = {
  title: "Sản phẩm | K-SMART",
  description: "Hàng chính hãng nhập khẩu. Giá tốt · Giao nhanh · Đổi trả 7 ngày.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="container mx-auto px-4 pt-3 pb-6 md:py-6">
      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsPageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const categorySlug = (resolvedSearchParams.category as string) || "";
  const search = ((resolvedSearchParams.q as string) || "").trim();
  const sort =
    (resolvedSearchParams.sort as (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT]) ||
    PRODUCT_SORT.LATEST;
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10));
  const parsedLimit = Number.parseInt((resolvedSearchParams.limit as string) || "12", 10);
  const pageSize = [4, 12, 24, 48].includes(parsedLimit) ? parsedLimit : 12;

  const rawMinPrice = Number.parseFloat((resolvedSearchParams.minPrice as string) || "");
  const rawMaxPrice = Number.parseFloat((resolvedSearchParams.maxPrice as string) || "");
  const minPrice = Number.isFinite(rawMinPrice) ? rawMinPrice : undefined;
  const maxPrice = Number.isFinite(rawMaxPrice) ? rawMaxPrice : undefined;
  const [categories, listing] = await Promise.all([
    getCategories(),
    getProductsForListing({
      search: search || undefined,
      categorySlug,
      sort,
      page,
      limit: pageSize,
      minPrice,
      maxPrice,
    }),
  ]);

  const activeCategory = categorySlug
    ? (() => {
        for (const cat of categories) {
          if (cat.slug === categorySlug) return cat;
          const child = cat.children?.find((c) => c.slug === categorySlug);
          if (child) return child;
        }
        return null;
      })()
    : null;

  return (
    <FilterProvider>
      <Breadcrumb className="py-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {activeCategory ? (
              <BreadcrumbLink asChild>
                <Link href={PRODUCTS_BASE_PATH}>Sản phẩm</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="font-semibold">Sản phẩm</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {activeCategory && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{activeCategory.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <CategorySidebar
          categories={categories}
          activeCategorySlug={categorySlug}
          basePath={PRODUCTS_BASE_PATH}
          activeMinPrice={minPrice}
          activeMaxPrice={maxPrice}
        />

        <main className="flex min-w-0 flex-col gap-5">
          <CategoryHero
            name={activeCategory?.name || "Tất cả sản phẩm"}
            total={listing.total}
            isCategorized={Boolean(activeCategory)}
          />

          <SubCategoryChips
            categories={categories}
            activeCategorySlug={categorySlug}
            basePath={PRODUCTS_BASE_PATH}
          />

          <CategoryListing
            products={listing.products}
            productsCount={listing.total}
            pageSize={pageSize}
            currentPage={page}
            activeSort={sort}
            activeCategorySlug={categorySlug}
            activeCategoryName={activeCategory?.name ?? ""}
            basePath={PRODUCTS_BASE_PATH}
            activeMinPrice={minPrice}
            activeMaxPrice={maxPrice}
          />
        </main>
      </div>
    </FilterProvider>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
      <div className="hidden h-fit space-y-4 lg:block">
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Skeleton key={n} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
