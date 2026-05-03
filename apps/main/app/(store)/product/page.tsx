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
import { headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";
import { Suspense } from "react";
import { FilterProvider } from "@/components/category/category-filter-context";
import { CategoryHero } from "@/components/category/category-hero";
import { CategoryListing } from "@/components/category/category-listing";
import { CategorySidebar } from "@/components/category/category-sidebar";
import { SubCategoryChips } from "@/components/products/listing/sub-category-chips";

const PRODUCTS_BASE_PATH = PUBLIC_ROUTES.PRODUCTS;

const MOBILE_PAGE_SIZES = [8, 16, 24, 48] as const;
const TABLET_PAGE_SIZES = [12, 24, 48] as const;
const DESKTOP_PAGE_SIZES = [15, 30, 48] as const;

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
  const ua = userAgent({ headers: await headers() });
  const allowedPageSizes =
    ua.device.type === "mobile"
      ? MOBILE_PAGE_SIZES
      : ua.device.type === "tablet"
        ? TABLET_PAGE_SIZES
        : DESKTOP_PAGE_SIZES;
  const defaultPageSize = allowedPageSizes[0];

  const categoryParam = resolvedSearchParams.category;
  const categorySlugs = Array.isArray(categoryParam)
    ? categoryParam
    : categoryParam
      ? [categoryParam]
      : [];
  const search = ((resolvedSearchParams.q as string) || "").trim();
  const sort =
    (resolvedSearchParams.sort as (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT]) ||
    PRODUCT_SORT.LATEST;
  const page = Math.max(1, Number.parseInt((resolvedSearchParams.page as string) || "1", 10));
  const parsedLimit = Number.parseInt(
    (resolvedSearchParams.limit as string) || String(defaultPageSize),
    10,
  );
  const pageSize = (allowedPageSizes as readonly number[]).includes(parsedLimit)
    ? parsedLimit
    : defaultPageSize;

  const rawMinPrice = Number.parseFloat((resolvedSearchParams.minPrice as string) || "");
  const rawMaxPrice = Number.parseFloat((resolvedSearchParams.maxPrice as string) || "");
  const minPrice = Number.isFinite(rawMinPrice) ? rawMinPrice : undefined;
  const maxPrice = Number.isFinite(rawMaxPrice) ? rawMaxPrice : undefined;
  const [categories, listing] = await Promise.all([
    getCategories(),
    getProductsForListing({
      search: search || undefined,
      categorySlugs,
      sort,
      page,
      limit: pageSize,
      minPrice,
      maxPrice,
    }),
  ]);

  const findCategory = (slug: string) => {
    for (const cat of categories) {
      if (cat.slug === slug) return cat;
      const child = cat.children?.find((c) => c.slug === slug);
      if (child) return child;
    }
    return null;
  };

  const activeCategories = categorySlugs.map(findCategory).filter(Boolean);
  const activeCategory = activeCategories.length === 1 ? activeCategories[0] : null;

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
          activeCategorySlugs={categorySlugs}
          basePath={PRODUCTS_BASE_PATH}
          activeMinPrice={minPrice}
          activeMaxPrice={maxPrice}
        />

        <main className="flex min-w-0 flex-col gap-5">
          <CategoryHero
            name={
              activeCategories.length > 1
                ? `${activeCategories.length} danh mục`
                : activeCategory?.name || "Tất cả sản phẩm"
            }
            total={listing.total}
            isCategorized={activeCategories.length > 0}
          />

          <SubCategoryChips
            categories={categories}
            activeCategorySlug={
              activeCategories.length === 1 ? (activeCategories[0]?.slug ?? "") : ""
            }
            basePath={PRODUCTS_BASE_PATH}
          />

          <CategoryListing
            products={listing.products}
            productsCount={listing.total}
            pageSize={pageSize}
            currentPage={page}
            activeSort={sort}
            activeCategorySlugs={categorySlugs}
            activeCategories={activeCategories.filter(
              (c): c is NonNullable<typeof c> => c !== null,
            )}
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
