"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Eye } from "lucide-react";
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
};

export function ProductCard({ product }: { product: FeaturedProduct }) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div
      data-testid="product-card"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8"
    >
      <Link
        href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="relative aspect-[4/5] overflow-hidden bg-muted/30"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
          <div className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </div>
        {product.stock <= 10 && product.stock > 0 && (
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Còn {product.stock}
            </span>
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

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
          {product.category}
        </span>
        <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>
          <h3 className="line-clamp-2 min-h-[2.5rem] cursor-pointer text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
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
