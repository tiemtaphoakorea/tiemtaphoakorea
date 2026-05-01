"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductStickyBuyProps {
  productName: string;
  variantName?: string;
  image: string;
  price: number;
  formatPrice: (n: number) => string;
  canOrder: boolean;
}

export function ProductStickyBuy({
  productName,
  variantName,
  image,
  price,
  formatPrice,
  canOrder,
}: ProductStickyBuyProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md transition-transform duration-200 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
          <Image src={image} alt={productName} fill className="object-contain" sizes="48px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {productName}
            {variantName && <span className="text-muted-foreground"> · {variantName}</span>}
          </p>
        </div>
        <span className="hidden flex-shrink-0 text-xl font-extrabold tabular-nums text-destructive sm:block">
          {formatPrice(price)}
        </span>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            disabled={!canOrder}
            className="hidden h-11 w-32 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
          >
            + Giỏ hàng
          </button>
          <button
            type="button"
            disabled={!canOrder}
            className="flex h-11 w-32 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
          >
            {canOrder ? "Mua ngay →" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}
