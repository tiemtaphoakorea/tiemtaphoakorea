"use client";

import type { Product } from "@workspace/shared/types/product";
import { useState } from "react";
import { ProductDetailTabs } from "./product-detail-tabs";
import { ProductGallery } from "./product-gallery";
import { ProductInfoActions } from "./product-info-actions";
import { ProductStickyBuy } from "./product-sticky-buy";

interface ProductClientContainerProps {
  product: Product;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export function ProductClientContainer({ product }: ProductClientContainerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || "");

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const images = selectedVariant?.images.map((img) => img.imageUrl) || [];
  const price = Number(selectedVariant?.price || product.basePrice || 0);
  const productBasePrice = Number(product.basePrice ?? 0);
  const hasDiscount = productBasePrice > price && productBasePrice > 0;
  const discountPct = hasDiscount ? Math.round(100 - (price / productBasePrice) * 100) : undefined;
  const stock = Number(selectedVariant?.onHand || 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 pb-10 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          key={selectedVariantId}
          images={images}
          productName={product.name}
          productId={product.id}
          productPrice={price}
          discountPercent={discountPct}
        />

        <ProductInfoActions
          product={product}
          basePrice={product.basePrice}
          selectedVariantId={selectedVariantId}
          setSelectedVariantId={setSelectedVariantId}
        />
      </div>

      <ProductDetailTabs product={product} />

      <ProductStickyBuy
        productName={product.name}
        variantName={selectedVariant?.name}
        image={images[0] || "/placeholder.png"}
        price={price}
        formatPrice={formatPrice}
        canOrder={stock > 0}
      />
    </>
  );
}
