"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Eye, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  stock: number;
  rating?: number;
  sold?: number;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: FeaturedProduct;
  priority?: boolean;
}) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : 0;

  return (
    <div
      data-testid="product-card"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8"
    >
      <Link
        href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="relative aspect-square overflow-hidden bg-muted/30 md:aspect-[3/4]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          className="object-contain transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 hidden items-center justify-center bg-black/0 transition-colors duration-300 group-hover:flex group-hover:bg-black/10 md:flex">
          <div className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </div>
        {discount > 0 && (
          <div className="absolute left-2 top-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discount}%
          </div>
        )}
        {product.stock <= 10 && product.stock > 0 && discount === 0 && (
          <div className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            Còn {product.stock}
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 md:gap-2 md:p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
          {product.category}
        </span>
        <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>
          <h3 className="line-clamp-2 min-h-[32px] cursor-pointer text-xs font-medium leading-snug text-foreground transition-colors group-hover:text-primary md:min-h-[2.5rem] md:text-sm md:font-semibold">
            {product.name}
          </h3>
        </Link>

        {product.rating ? (
          <div className="flex items-center gap-1 md:hidden">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-[11px] font-semibold text-muted-foreground">
              {product.rating.toFixed(1)}
            </span>
            {product.sold ? (
              <span className="text-[10px] text-muted-foreground/70">({product.sold})</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-baseline gap-1.5 pt-1 md:flex-col md:items-start md:gap-0">
          <span className="text-sm font-extrabold tracking-tight text-destructive md:text-base md:text-primary">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-muted-foreground line-through md:text-xs">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <Link
          href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
          className="mt-1 inline-flex items-center justify-center gap-1 rounded-full bg-primary py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-primary/90 md:hidden"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Thêm
        </Link>
      </div>

      <div className="hidden px-4 pb-4 md:block">
        <Button
          asChild
          className="h-9 w-full rounded-full bg-primary/8 text-xs font-semibold text-primary shadow-none hover:bg-primary hover:text-white transition-all border-0"
        >
          <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>Xem chi tiết</Link>
        </Button>
      </div>
    </div>
  );
}
