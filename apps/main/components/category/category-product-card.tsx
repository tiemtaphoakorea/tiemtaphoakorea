"use client";

import type { ProductListItem } from "@workspace/database/services/product.server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CategoryProductCardProps {
  product: ProductListItem;
  variant?: "grid" | "list";
}

export function CategoryProductCard({ product, variant = "grid" }: CategoryProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const price = product.minPrice || Number(product.basePrice) || 0;
  const basePrice = Number(product.basePrice) || 0;
  const hasDiscount = basePrice > 0 && price > 0 && basePrice > price;
  const discountPct = hasDiscount ? Math.round(100 - (price / basePrice) * 100) : 0;
  const detailHref = `/product/${product.slug}`;

  if (variant === "list") {
    return (
      <Link href={detailHref} className="group block" data-testid={`product-card-${product.slug}`}>
        <Card className="flex-row gap-0 overflow-hidden py-0 transition-all duration-300 hover:ring-primary/30">
          <div className="relative aspect-square w-32 shrink-0 bg-muted/40 sm:w-36">
            <Image
              src={product.thumbnail || "/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 128px, 144px"
            />
            {hasDiscount && (
              <Badge className="absolute left-2 top-2 h-5 rounded-full bg-destructive px-2 text-[10px] font-bold text-destructive-foreground">
                −{discountPct}%
              </Badge>
            )}
          </div>
          <CardContent className="flex flex-1 items-start gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              {product.categoryName && (
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {product.categoryName}
                </div>
              )}
              <h3 className="mb-2 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {product.name}
              </h3>
              {product.description && (
                <p className="line-clamp-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span
                data-testid="product-card-price"
                className="block text-lg font-extrabold tracking-tight text-destructive tabular-nums sm:text-xl"
              >
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] font-medium text-muted-foreground line-through tabular-nums">
                  {formatPrice(basePrice)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className="group relative gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/30"
      data-testid={`product-card-${product.slug}`}
    >
      <Link href={detailHref} className="relative block aspect-square overflow-hidden bg-muted/30">
        <Image
          src={product.thumbnail || "/placeholder.png"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
        />
        {hasDiscount && (
          <Badge className="absolute left-2 top-2 h-5 rounded-full bg-destructive px-2 text-[10px] font-bold text-destructive-foreground">
            −{discountPct}%
          </Badge>
        )}
        {product.totalStock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <Badge variant="secondary" className="bg-background text-xs font-semibold">
              Hết hàng
            </Badge>
          </div>
        )}
      </Link>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isFavorited ? "Bỏ yêu thích" : "Thêm yêu thích"}
        onClick={(e) => {
          e.preventDefault();
          setIsFavorited((v) => !v);
        }}
        className="absolute right-2 top-2 z-10 size-8 rounded-full border border-border bg-background/90 text-muted-foreground backdrop-blur-sm hover:bg-background hover:text-destructive"
      >
        <Heart
          className={`size-4 transition-colors ${
            isFavorited ? "fill-destructive text-destructive" : ""
          }`}
        />
      </Button>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-3 md:p-3.5">
        {product.categoryName && (
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {product.categoryName}
          </span>
        )}
        <Link href={detailHref}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-sm">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-1.5 pt-1">
          <span
            data-testid="product-card-price"
            className="text-[15px] font-extrabold tracking-tight text-destructive tabular-nums md:text-base"
          >
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] font-medium text-muted-foreground line-through tabular-nums">
              {formatPrice(basePrice)}
            </span>
          )}
        </div>
        <StockBar stock={product.totalAvailable ?? product.totalStock ?? 0} />
      </CardContent>
    </Card>
  );
}

function StockBar({ stock }: { stock: number }) {
  const safeStock = Math.max(0, stock);
  // Visual fill: 100% at >= 50 units, scaled down to 8% min when there's any stock left.
  const fillPct = safeStock <= 0 ? 0 : Math.min(100, Math.max(8, (safeStock / 50) * 100));

  let label: string;
  let tone: "out" | "low" | "ok";
  if (safeStock <= 0) {
    label = "Hết hàng";
    tone = "out";
  } else if (safeStock <= 5) {
    label = `Sắp hết — còn ${safeStock}`;
    tone = "low";
  } else {
    label = `Còn ${safeStock} sản phẩm`;
    tone = "ok";
  }

  const trackBg = "bg-muted";
  const fillBg =
    tone === "out" ? "bg-destructive/60" : tone === "low" ? "bg-warning" : "bg-success";
  const labelColor =
    tone === "out" ? "text-destructive" : tone === "low" ? "text-warning" : "text-muted-foreground";

  return (
    <div className="mt-2 space-y-1.5">
      <div
        role="progressbar"
        aria-label="Hàng còn trong kho"
        aria-valuenow={safeStock}
        aria-valuemin={0}
        className={`h-1.5 w-full overflow-hidden rounded-full ${trackBg}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillBg}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className={`block text-[11px] font-semibold tabular-nums ${labelColor}`}>{label}</span>
    </div>
  );
}
