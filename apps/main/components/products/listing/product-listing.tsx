import type { ProductListItem } from "@repo/database/services/product.server";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Search, SlidersHorizontal } from "lucide-react";
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
      <div className="py-20 text-center">
        <div className="text-muted-foreground mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
          <Search className="h-10 w-10" />
        </div>
        <h3 className="mb-2 text-xl font-bold">Không tìm thấy sản phẩm</h3>
        <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        <Button variant="link" className="text-primary mt-4 font-bold" onClick={onResetFilters}>
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
        className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-3 transition-all hover:shadow-xl md:flex-row dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-xl md:w-44">
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
      <div className="hover:border-primary/20 relative flex h-full flex-col overflow-hidden rounded-2xl border border-transparent bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(235,46,92,0.1)] dark:bg-slate-900">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute right-3 bottom-3 flex translate-y-12 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="text-primary flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-primary text-[10px] font-black tracking-widest uppercase">
              {product.categoryName}
            </span>
          </div>

          <h3 className="group-hover:text-primary mb-2 line-clamp-2 flex-1 text-sm leading-tight font-bold transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="flex flex-col">
              <span data-testid="product-card-price" className="text-primary text-base font-black">
                {formatPrice(product.minPrice || Number(product.basePrice) || 0)}
              </span>
              {/* Original Price removed */}
            </div>
            <div className="bg-primary shadow-primary/20 flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-110">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
