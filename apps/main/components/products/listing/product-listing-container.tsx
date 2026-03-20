"use client";

import type { ProductListItem } from "@repo/database/services/product.server";
import { PRODUCT_SORT } from "@repo/shared/constants";
import { PUBLIC_ROUTES } from "@repo/shared/routes";
import type { ProductSort } from "@repo/shared/types/product";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductListing } from "@/components/products/listing/product-listing";
import { ProductPagination } from "@/components/products/listing/product-pagination";
import { ProductToolbar } from "@/components/products/listing/product-toolbar";

const PRODUCT_SORT_SET = new Set<string>(Object.values(PRODUCT_SORT));

interface ProductListingContainerProps {
  pageSize: number;
  currentPage: number;
  activeSort: ProductSort;
  searchQuery: string;
  activeCategorySlug: string;
  products: ProductListItem[];
  productsCount: number;
}

export function ProductListingContainer({
  pageSize,
  currentPage,
  activeSort,
  searchQuery,
  activeCategorySlug,
  products,
  productsCount,
}: ProductListingContainerProps) {
  "use no memo";
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const resolvedActiveSort = PRODUCT_SORT_SET.has(activeSort) ? activeSort : PRODUCT_SORT.LATEST;

  const buildParams = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (activeCategorySlug) {
      params.set("category", activeCategorySlug);
    }

    if (resolvedActiveSort !== PRODUCT_SORT.LATEST) {
      params.set("sort", resolvedActiveSort);
    }

    if (currentPage > 1) {
      params.set("page", String(currentPage));
    }

    return params;
  };

  const handleSortChange = (sort: string) => {
    const params = buildParams();
    params.set("sort", sort);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  const handleSearchChange = (q: string) => {
    const params = buildParams();
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  const handleResetFilters = () => {
    router.push(PUBLIC_ROUTES.PRODUCTS);
  };

  return (
    <div className="flex-1">
      <div className="mb-6 space-y-3">
        <ProductToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          productsCount={productsCount}
          activeSort={resolvedActiveSort}
          onSortChange={handleSortChange}
        />

        {productsCount > 0 && (
          <ProductPagination
            totalItems={productsCount}
            currentPage={currentPage}
            pageSize={pageSize}
          />
        )}
      </div>

      <ProductListing products={products} viewMode={viewMode} onResetFilters={handleResetFilters} />
    </div>
  );
}
