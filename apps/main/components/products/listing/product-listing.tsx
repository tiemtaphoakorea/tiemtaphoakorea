import type { ProductListItem } from "@workspace/database/services/product.server";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";

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
        <ProductCard key={product.id} product={product} layout={viewMode} />
      ))}
    </div>
  );
}
