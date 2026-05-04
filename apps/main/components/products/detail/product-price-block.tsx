"use client";

import { ShieldCheck } from "lucide-react";

interface ProductPriceBlockProps {
  price: number;
  basePrice?: number;
  formatPrice: (n: number) => string;
}

export function ProductPriceBlock({ price, basePrice, formatPrice }: ProductPriceBlockProps) {
  const hasDiscount = basePrice !== undefined && basePrice > 0 && basePrice > price;
  const discountPct = hasDiscount ? Math.round(100 - (price / basePrice!) * 100) : 0;
  const points = Math.round(price / 100);

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-secondary/60 p-5">
      <div className="flex items-baseline gap-3">
        <span
          data-testid="product-price"
          className="text-4xl font-extrabold tracking-tight text-destructive tabular-nums"
        >
          {formatPrice(price)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-base font-medium text-muted-foreground line-through tabular-nums">
              {formatPrice(basePrice!)}
            </span>
            <span className="rounded-full bg-destructive px-2.5 py-1 text-sm font-bold text-destructive-foreground">
              −{discountPct}%
            </span>
          </>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Tích luỹ <b className="text-success">{points} điểm Korea</b> cho đơn hàng này
      </p>
    </div>
  );
}
