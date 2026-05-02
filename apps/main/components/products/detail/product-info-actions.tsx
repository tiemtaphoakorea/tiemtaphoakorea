"use client";

import type { Product } from "@workspace/shared/types/product";
import { ProductPerksGrid } from "./product-perks-grid";
import { ProductPriceBlock } from "./product-price-block";
import { ProductVariantChips } from "./product-variant-chips";

interface ProductInfoActionsProps {
  product: Product;
  basePrice?: string | number;
  selectedVariantId: string;
  setSelectedVariantId: (id: string) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export function ProductInfoActions({
  product,
  basePrice,
  selectedVariantId,
  setSelectedVariantId,
}: ProductInfoActionsProps) {
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const price = Number(selectedVariant?.price || basePrice || 0);
  const productBasePrice = Number(basePrice ?? 0);
  const stock = Number(selectedVariant?.onHand || 0);
  const canOrder = stock > 0;

  const subtitle = product.description
    ? product.description.length > 160
      ? `${product.description.slice(0, 157)}…`
      : product.description
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground">
          🇰🇷 Nhập khẩu chính ngạch
        </span>
        {product.category?.name && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {product.category.name}
          </span>
        )}
        {productBasePrice > price && (
          <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground">
            −{Math.round(100 - (price / productBasePrice) * 100)}%
          </span>
        )}
      </div>

      <div>
        {product.category?.name && (
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">
            {product.category.name}
          </p>
        )}
        <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-tight text-foreground lg:text-[30px]">
          {product.name}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <ProductPriceBlock
        price={price}
        basePrice={productBasePrice > price ? productBasePrice : undefined}
        formatPrice={formatPrice}
      />

      <ProductVariantChips
        variants={product.variants}
        selectedVariantId={selectedVariantId}
        onSelect={setSelectedVariantId}
      />

      {!canOrder && (
        <p className="text-center text-xs text-muted-foreground">
          Sản phẩm tạm hết hàng — vui lòng quay lại sau
        </p>
      )}

      <ProductPerksGrid />
    </div>
  );
}
