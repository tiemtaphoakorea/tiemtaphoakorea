"use client";

import type { ProductListItem } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ProductPagination } from "@/components/products/listing/product-pagination";
import { ProductCard } from "@/components/products/product-card";
import { CategoryToolbar } from "./category-toolbar";

const PRODUCT_SORT_SET = new Set<string>(Object.values(PRODUCT_SORT));

const PRICE_RANGE_LABELS: Record<string, string> = {
  "100000": "Dưới 100.000đ",
  "100000-299000": "100k – 299k",
  "300000-499000": "300k – 499k",
  "500000": "Trên 500.000đ",
};

function getPriceRangeLabel(min?: number, max?: number): string | null {
  if (min === undefined && max === undefined) return null;
  const key =
    min !== undefined && max !== undefined
      ? `${min}-${max}`
      : min !== undefined
        ? `${min}`
        : `${max}`;
  return PRICE_RANGE_LABELS[key] ?? `${min ?? ""}–${max ?? ""}`;
}

interface CategoryListingProps {
  products: ProductListItem[];
  productsCount: number;
  pageSize: number;
  currentPage: number;
  activeSort: string;
  activeCategorySlugs: string[];
  activeCategories: { slug: string; name: string }[];
  basePath: string;
  activeMinPrice?: number;
  activeMaxPrice?: number;
}

function CategoryListingInner({
  products,
  productsCount,
  pageSize,
  currentPage,
  activeSort,
  activeCategorySlugs,
  activeCategories,
  basePath,
  activeMinPrice,
  activeMaxPrice,
}: CategoryListingProps) {
  "use no memo";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const resolvedActiveSort = PRODUCT_SORT_SET.has(activeSort) ? activeSort : PRODUCT_SORT.LATEST;

  const buildParams = () => new URLSearchParams(searchParams.toString());

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  const handleSortChange = (sort: string) => {
    const params = buildParams();
    params.set("sort", sort);
    params.delete("page");
    pushParams(params);
  };

  const handleRemoveCategory = (slug: string) => {
    const params = buildParams();
    params.delete("category");
    for (const s of activeCategorySlugs.filter((c) => c !== slug)) {
      params.append("category", s);
    }
    params.delete("page");
    pushParams(params);
  };

  const handleClearPriceRange = () => {
    const params = buildParams();
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");
    pushParams(params);
  };

  const priceRangeLabel = getPriceRangeLabel(activeMinPrice, activeMaxPrice);

  const activeFilters = [
    ...activeCategories.map((cat) => ({
      key: `category-${cat.slug}`,
      label: cat.name,
      onRemove: () => handleRemoveCategory(cat.slug),
    })),
    ...(priceRangeLabel
      ? [{ key: "price", label: priceRangeLabel, onRemove: handleClearPriceRange }]
      : []),
  ];

  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <CategoryToolbar
          productsCount={productsCount}
          activeSort={resolvedActiveSort}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilters={activeFilters}
        />
        <Card className="items-center gap-4 border-dashed bg-card py-16 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Search className="size-7 text-primary/50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Không tìm thấy sản phẩm</h3>
              <p className="text-sm text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(basePath)}
              className="mt-2 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Xóa tất cả bộ lọc
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoryToolbar
        productsCount={productsCount}
        activeSort={resolvedActiveSort}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilters={activeFilters}
      />

      <div
        data-testid="product-list"
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5"
            : "flex flex-col gap-3"
        }
      >
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            layout={viewMode}
            showStockBar
            showWishlist
            priority={i < 4}
          />
        ))}
      </div>

      {productsCount > 0 && (
        <ProductPagination
          totalItems={productsCount}
          currentPage={currentPage}
          pageSize={pageSize}
          basePath={basePath}
        />
      )}
    </div>
  );
}

// Skeleton matches the toolbar's right-side controls + a thin grid hint so users don't see an
// empty rectangle that suddenly fills with a sort dropdown after hydration.
function CategoryListingFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <div className="h-9 w-44 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-[76px] animate-pulse rounded-[12px] bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function CategoryListing(props: CategoryListingProps) {
  return (
    <Suspense fallback={<CategoryListingFallback />}>
      <CategoryListingInner {...props} />
    </Suspense>
  );
}
