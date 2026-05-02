"use client";

import type { ProductListItem } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import type { ProductSort } from "@workspace/shared/types/product";
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
  activeCategoryName: string;
  products: ProductListItem[];
  productsCount: number;
}

export function ProductListingContainer({
  pageSize,
  currentPage,
  activeSort,
  searchQuery,
  activeCategorySlug,
  activeCategoryName,
  products,
  productsCount,
}: ProductListingContainerProps) {
  "use no memo";
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const resolvedActiveSort = PRODUCT_SORT_SET.has(activeSort) ? activeSort : PRODUCT_SORT.LATEST;

  const buildParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategorySlug) params.set("category", activeCategorySlug);
    if (resolvedActiveSort !== PRODUCT_SORT.LATEST) params.set("sort", resolvedActiveSort);
    if (pageSize !== 12) params.set("limit", String(pageSize));
    if (currentPage > 1) params.set("page", String(currentPage));
    return params;
  };

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  const handleSortChange = (sort: string) => {
    const params = buildParams();
    params.set("sort", sort);
    params.delete("page");
    pushParams(params);
  };

  const handlePageSizeChange = (size: number) => {
    const params = buildParams();
    params.set("limit", String(size));
    params.delete("page");
    pushParams(params);
  };

  const handleSearchChange = (q: string) => {
    const params = buildParams();
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  const handleClearCategory = () => {
    const params = buildParams();
    params.delete("category");
    params.delete("page");
    pushParams(params);
  };

  const handleClearSearch = () => handleSearchChange("");

  const handleResetFilters = () => {
    router.push(PUBLIC_ROUTES.PRODUCTS);
  };

  const activeFilters = [
    activeCategoryName
      ? { key: "category", label: activeCategoryName, onRemove: handleClearCategory }
      : null,
    searchQuery ? { key: "search", label: `"${searchQuery}"`, onRemove: handleClearSearch } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  return (
    <div className="flex flex-col gap-4">
      <ProductToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        productsCount={productsCount}
        activeSort={resolvedActiveSort}
        onSortChange={handleSortChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        activeFilters={activeFilters}
      />

      <ProductListing products={products} viewMode={viewMode} onResetFilters={handleResetFilters} />

      {productsCount > 0 && (
        <ProductPagination
          totalItems={productsCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
