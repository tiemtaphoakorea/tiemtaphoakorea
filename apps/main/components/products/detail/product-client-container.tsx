"use client";

import type { Product } from "@repo/shared/types/product";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { ProductGallery } from "./product-gallery";
import { ProductInfoActions } from "./product-info-actions";

interface ProductClientContainerProps {
  product: Product;
}

export function ProductClientContainer({ product }: ProductClientContainerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || "");

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const images = selectedVariant?.images.map((img) => img.imageUrl) || [];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      {/* Left Side: Images */}
      {/* Pass the images derived from state */}
      <ProductGallery key={selectedVariantId} images={images} productName={product.name} />

      {/* Right Side: Product Info */}
      <div className="flex flex-col">
        <div className="space-y-4">
          <h1 className="text-3xl leading-tight font-black tracking-tight lg:text-4xl">
            {product.name}
          </h1>

          {/* Price, Stock, Actions, Variant Selector */}
          {/* We pass the state setter to this component so it can update the variant */}
          <ProductInfoActions
            product={product}
            basePrice={product.basePrice}
            selectedVariantId={selectedVariantId}
            setSelectedVariantId={setSelectedVariantId}
            // We pass the computed 'price' etc inside, or let it compute?
            // Better to let it compute based on 'selectedVariantId' to keep logic close.
          />

          {/* Trust Badges - Static */}
          <div className="border-border/40 grid grid-cols-1 gap-4 border-t border-b py-8 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/5 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Giao hàng nhanh</h4>
                <p className="text-muted-foreground text-[10px]">Toàn quốc từ 2-4 ngày</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/5 text-green-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Chính hãng 100%</h4>
                <p className="text-muted-foreground text-[10px]">Cam kết xuất xứ rõ ràng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/5 text-blue-500">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Đổi trả 7 ngày</h4>
                <p className="text-muted-foreground text-[10px]">Nếu có lỗi sản phẩm</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 py-8">
            <h3 className="text-xl font-bold">Mô tả sản phẩm</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
              {product.description || "Đang cập nhật nội dung mô tả..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
