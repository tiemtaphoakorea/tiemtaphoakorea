import type { ProductListItem } from "@repo/database/services/product.server";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductListingProps {
  products: ProductListItem[];
  viewMode: "grid" | "list";
  onResetFilters: () => void;
}

export function ProductListing({ products, viewMode, onResetFilters }: ProductListingProps) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Search className="h-8 w-8 text-primary/50" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">Không tìm thấy sản phẩm</h3>
        <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        <Button variant="outline" size="sm" className="mt-6 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white" onClick={onResetFilters}>
          Xóa tất cả bộ lọc
        </Button>
      </div>
    );
  }

  return (
    <div
      data-testid="product-list"
      className={
        viewMode === "grid"
          ? "grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4"
          : "flex flex-col gap-6"
      }
    >
      {products.map((product) => (
        <ProductItem key={product.id} product={product} viewMode={viewMode} />
      ))}
    </div>
  );
}

function ProductItem({
  product,
  viewMode,
}: {
  product: ProductListItem;
  viewMode: "grid" | "list";
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (viewMode === "list") {
    return (
      <Link
        href={`/products/${product.slug}`}
        data-testid={`product-card-${product.slug}`}
        className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-3 transition-all hover:shadow-md hover:border-primary/20 md:flex-row"
      >
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl md:w-40">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 224px"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center py-2">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase"
            >
              {product.categoryName}
            </Badge>
          </div>
          <h3 className="group-hover:text-primary mb-2 text-lg font-bold transition-colors">
            {product.name}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm font-medium">
            {product.description}
          </p>
          <div className="mt-auto flex items-center gap-4">
            <span data-testid="product-card-price" className="text-primary text-xl font-black">
              {formatPrice(product.minPrice || Number(product.basePrice) || 0)}
            </span>
            {/* Original Price removed as not in API */}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group flex h-full flex-col"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-md dark:bg-card">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
              {product.categoryName}
            </span>
          </div>

          <h3 className="mb-2 line-clamp-2 flex-1 text-sm leading-tight font-bold group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="flex flex-col">
              <span data-testid="product-card-price" className="text-primary text-base font-black">
                {formatPrice(product.minPrice || Number(product.basePrice) || 0)}
              </span>
              {/* Original Price removed */}
            </div>
            <div className="bg-secondary text-primary shadow-none flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:bg-primary group-hover:text-white group-hover:scale-110">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
