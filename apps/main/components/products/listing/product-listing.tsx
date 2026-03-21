import type { ProductListItem } from "@workspace/database/services/product.server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Eye, Search } from "lucide-react";
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
        <p className="text-sm text-muted-foreground">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white"
          onClick={onResetFilters}
        >
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
          ? "grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4"
          : "flex flex-col gap-4"
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
        className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-3 transition-all duration-300 hover:border-primary/20 hover:shadow-md md:flex-row cursor-pointer"
      >
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl md:w-36">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 180px"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center py-1.5">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border-none bg-secondary text-primary text-[10px] font-bold uppercase tracking-wide"
            >
              {product.categoryName}
            </Badge>
          </div>
          <h3 className="mb-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          <div className="mt-auto flex items-center gap-4">
            <span data-testid="product-card-price" className="text-lg font-extrabold text-primary">
              {formatPrice(product.minPrice || Number(product.basePrice) || 0)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/8">
          <div className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
          {product.categoryName}
        </span>
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
          <span data-testid="product-card-price" className="text-base font-extrabold text-primary">
            {formatPrice(product.minPrice || Number(product.basePrice) || 0)}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary transition-all group-hover:bg-primary group-hover:text-white">
            <Eye className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
