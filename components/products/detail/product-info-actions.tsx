"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/types/product";

interface ProductInfoActionsProps {
  product: Product;
  // Optional: Pass generic price/stock if no variants exist
  basePrice?: string | number;
  selectedVariantId: string;
  setSelectedVariantId: (id: string) => void;
}

export function ProductInfoActions({
  product,
  basePrice,
  selectedVariantId,
  setSelectedVariantId,
}: ProductInfoActionsProps) {
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const price = Number(selectedVariant?.price || basePrice || 0);
  const stock = Number(selectedVariant?.stockQuantity || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Stock status: only quantity is tracked
  const stockStatusLabel = stock > 0 ? "Sẵn sàng giao" : "Tạm hết hàng";
  const stockStatusColor = stock > 0 ? "text-green-600" : "text-red-600";
  const dotColor = stock > 0 ? "bg-green-500 animate-pulse" : "bg-red-500";
  const canOrder = stock > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 py-4">
        <div className="flex items-baseline gap-3">
          <span data-testid="product-price" className="text-primary text-4xl font-black">
            {formatPrice(price)}
          </span>
        </div>
      </div>

      {/* Variant Selector */}
      {product.variants.length > 1 && (
        <div className="space-y-3 pb-4">
          <label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
            Phân loại:
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selectedVariantId === v.id
                    ? "border-primary bg-primary/5 text-primary ring-primary ring-1"
                    : "border-border bg-white hover:border-gray-400"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-border/50" />

      <div className="space-y-6 py-6">
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
            Tình trạng hàng hóa
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${dotColor}`} />
              <span
                data-testid="stock-status-label"
                className={`text-lg font-bold ${stockStatusColor}`}
              >
                {stockStatusLabel}
              </span>
            </div>

            {stock > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground text-sm font-medium">
                  Còn hàng ({stock})
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            disabled={!canOrder}
            className="shadow-primary/20 bg-primary hover:bg-primary/90 group h-14 rounded-full text-lg font-bold shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canOrder ? "Liên hệ đặt hàng ngay" : "Hết hàng"}
          </Button>
          <p className="text-muted-foreground text-center text-[10px] font-medium italic">
            * Sản phẩm này hiện chỉ hỗ trợ đặt chuyển khoản hoặc gọi điện trực tiếp qua Hotline.
          </p>
        </div>
      </div>
    </div>
  );
}
