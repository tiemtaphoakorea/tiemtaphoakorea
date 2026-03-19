"use client";

import type { ProductListItem } from "@repo/database/services/product.server";
import { PRODUCT_SORT } from "@repo/shared/constants";
import { PUBLIC_ROUTES } from "@repo/shared/routes";
import type { ProductSort } from "@repo/shared/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProductListing } from "@/components/products/listing/product-listing";
import { ProductPagination } from "@/components/products/listing/product-pagination";
import { ProductToolbar } from "@/components/products/listing/product-toolbar";

const PRODUCT_SORT_SET = new Set<string>(Object.values(PRODUCT_SORT));

interface ProductListingContainerProps {
  pageSize: number;
  initialCurrentPage: number;
  initialActiveSort: ProductSort;
  initialSearchQuery: string;
}

function ProductListingContainerInner({
  pageSize,
  initialCurrentPage,
  initialActiveSort,
}: ProductListingContainerProps) {
  "use no memo";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const queryString = searchParams.toString();
  const querySearch = searchParams.get("q") || searchParams.get("search") || "";
  const querySort = searchParams.get("sort") || initialActiveSort;
  const activeSort = PRODUCT_SORT_SET.has(querySort)
    ? (querySort as ProductSort)
    : PRODUCT_SORT.LATEST;
  const parsedPage = Number.parseInt(searchParams.get("page") || String(initialCurrentPage), 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Derive localSearch from URL params directly during render instead of syncing via useEffect
  const localSearch = querySearch;

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams(queryString);
        params.set("limit", String(pageSize));

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          products: ProductListItem[];
          total: number;
        };

        setProducts(data.products || []);
        setProductsCount(Number(data.total || 0));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load products listing:", error);
        setProducts([]);
        setProductsCount(0);
        setLoadError("Không thể tải danh sách sản phẩm.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [pageSize, queryString]);

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  const handleSearchChange = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
          searchQuery={localSearch}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          productsCount={productsCount}
          activeSort={activeSort}
          onSortChange={handleSortChange}
        />

        {!isLoading && productsCount > 0 && (
          <ProductPagination
            totalItems={productsCount}
            currentPage={currentPage}
            pageSize={pageSize}
          />
        )}
      </div>

      {loadError ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-primary mt-3 text-sm font-semibold"
          >
            Thử lại
          </button>
        </div>
      ) : isLoading ? (
        <div
          data-testid="product-list"
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4"
              : "flex flex-col gap-6"
          }
        >
          {Array.from({ length: pageSize }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="h-[260px] animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      ) : (
        <ProductListing
          products={products}
          viewMode={viewMode}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}

export function ProductListingContainer(props: ProductListingContainerProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductListingContainerInner {...props} />
    </Suspense>
  );
}
