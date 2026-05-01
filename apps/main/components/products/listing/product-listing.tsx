import type { ProductListItem } from "@workspace/database/services/product.server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
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
            onClick={onResetFilters}
            className="mt-2 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Xóa tất cả bộ lọc
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      data-testid="product-list"
      className={
        viewMode === "grid"
          ? "grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5"
          : "flex flex-col gap-3"
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
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const price = product.minPrice || Number(product.basePrice) || 0;
  const hasPriceRange = product.minPrice && product.maxPrice && product.maxPrice > product.minPrice;

  if (viewMode === "list") {
    return (
      <Link
        href={`/product/${product.slug}`}
        data-testid={`product-card-${product.slug}`}
        className="group block"
      >
        <Card className="flex-row gap-0 py-0 transition-all duration-300 hover:ring-primary/30">
          <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-muted/40 sm:w-36">
            <Image
              src={product.thumbnail || "/placeholder.png"}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 128px, 144px"
            />
          </div>
          <CardContent className="flex flex-1 items-start gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              {product.categoryName && (
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {product.categoryName}
                </div>
              )}
              <h3 className="mb-2 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {product.name}
              </h3>
              {product.description && (
                <p className="line-clamp-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span
                data-testid="product-card-price"
                className="block text-lg font-extrabold tracking-tight text-primary tabular-nums sm:text-xl"
              >
                {formatPrice(price)}
              </span>
              {hasPriceRange && (
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  đến {formatPrice(product.maxPrice)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group block h-full"
    >
      <Card className="h-full gap-0 py-0 transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/30">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <Image
            src={product.thumbnail || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
          {product.totalStock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
              <Badge variant="secondary" className="bg-background text-xs font-semibold">
                Hết hàng
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-1 p-3 md:p-3.5">
          {product.categoryName && (
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {product.categoryName}
            </span>
          )}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-sm">
            {product.name}
          </h3>
          <div className="mt-auto flex items-baseline gap-1.5 pt-2">
            <span
              data-testid="product-card-price"
              className="text-[15px] font-extrabold tracking-tight text-primary tabular-nums md:text-base"
            >
              {formatPrice(price)}
            </span>
            {hasPriceRange && (
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                +{formatPrice(product.maxPrice - price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
