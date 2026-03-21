"use client";

import type { Product } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";

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
          <span data-testid="product-price" className="text-4xl font-black text-primary">
            {formatPrice(price)}
          </span>
        </div>
      </div>

      {/* Variant Selector */}
      {product.variants.length > 1 && (
        <div className="space-y-3 pb-4">
          <Label className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
            Phân loại:
          </Label>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              return (
                <Button
                  key={v.id}
                  variant="outline"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`relative ${
                    isSelected
                      ? "border-2 border-primary bg-white text-primary shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                      : "border border-border bg-white text-muted-foreground hover:border-slate-400 hover:text-foreground"
                  }`}
                >
                  {v.name}
                  {isSelected && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                      ✓
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <Separator className="bg-border/50" />

      <div className="space-y-6 py-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
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
                <span className="text-sm font-medium text-muted-foreground">
                  Còn hàng ({stock})
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            disabled={!canOrder}
            className="group h-14 rounded-full bg-primary text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canOrder ? "Liên hệ đặt hàng ngay" : "Hết hàng"}
          </Button>
          <p className="text-center text-[10px] font-medium text-muted-foreground italic">
            * Sản phẩm này hiện chỉ hỗ trợ đặt chuyển khoản hoặc gọi điện trực tiếp qua Hotline.
          </p>
        </div>
      </div>
    </div>
  );
}
