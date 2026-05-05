"use client";

import { Heart, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useWishlist } from "@/hooks/use-wishlist";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  productId?: string;
  productPrice?: number;
  productSlug?: string;
  /** Discount percent, e.g. 40 -> shows "Flash −40%" badge */
  discountPercent?: number;
}

export function ProductGallery({
  images,
  productName,
  productId,
  productPrice,
  productSlug,
  discountPercent,
}: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();

  const safeImages = images.length > 0 ? images : ["/placeholder.png"];
  const currentImage = safeImages[selectedImageIndex] || safeImages[0]!;
  const wishlisted = productId ? isInWishlist(productId) : false;

  const handleSelectImage = (index: number) => {
    if (index === selectedImageIndex) return;
    setFading(true);
    setTimeout(() => {
      setSelectedImageIndex(index);
      setFading(false);
    }, 180);
  };

  const handleWishlistToggle = () => {
    if (!productId) return;
    toggleItem({
      id: productId,
      name: productName,
      price: productPrice ?? 0,
      image: safeImages[0]!,
      slug: productSlug,
    });
  };

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-20">
      <div className="group relative aspect-square overflow-hidden rounded-3xl border border-border bg-secondary shadow-sm transition-shadow hover:shadow-lg">
        <div
          className={`absolute inset-0 transition-[opacity,transform] duration-[180ms] ease-in-out ${
            fading ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <Image
            src={currentImage}
            alt={productName}
            fill
            className="cursor-zoom-in object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {discountPercent !== undefined && discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-sm font-extrabold text-destructive-foreground shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Flash −{discountPercent}%
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Chính hãng
          </span>
        </div>

        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? `Bỏ yêu thích ${productName}` : `Yêu thích ${productName}`}
          className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all hover:scale-105 ${
            wishlisted ? "text-destructive" : "text-muted-foreground hover:text-destructive"
          }`}
        >
          <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => handleSelectImage(index)}
              aria-label={`Ảnh ${index + 1}`}
              className={`relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                selectedImageIndex === index
                  ? "border-primary"
                  : "border-border opacity-80 hover:border-primary hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} ${index + 1}`}
                fill
                className="object-contain"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
