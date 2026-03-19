"use client";

import { PUBLIC_ROUTES } from "@repo/shared/routes";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import { Eye, Heart } from "lucide-react";
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

type FeaturedProductsProps = {
  products: FeaturedProduct[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section
      id="featured-products"
      data-testid="featured-products"
      className="bg-gray-50/30 py-12 dark:bg-slate-900/10"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-primary text-3xl font-bold tracking-tight">Sản phẩm nổi bật</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Những sản phẩm K-Beauty được tin dùng tại Việt Nam
            </p>
          </div>
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="text-primary bg-primary/5 rounded-full px-4 py-2 text-sm font-bold hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-8 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Card
      data-testid="product-card"
      className="py-0 group hover:shadow-primary/10 hover:border-primary/20 flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-none border-transparent bg-white transition-all duration-500 hover:shadow-2xl dark:bg-slate-900"
    >
      <Link
        href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="relative aspect-[4/5] overflow-hidden rounded-t-[1.5rem] bg-gray-50"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex translate-x-12 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            type="button"
            aria-label={`Yêu thích ${product.name}`}
            className="hover:text-primary flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-xl transition-colors"
            onClick={(e) => {
              e.preventDefault(); /* Handle heart */
            }}
          >
            <Heart className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={`Xem nhanh ${product.name}`}
            className="hover:text-primary flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-xl transition-colors"
            onClick={(e) => {
              e.preventDefault(); /* Handle eye */
            }}
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <div className="text-primary bg-primary/5 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
          {product.category}
        </div>
        <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>
          <h3 className="group-hover:text-primary line-clamp-2 min-h-[2.5rem] cursor-pointer text-base leading-tight font-bold transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-xl font-black">{formatPrice(product.price)}</span>
          </div>
          {product.originalPrice && (
            <span className="text-muted-foreground text-xs font-medium line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Level */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100`}>
            <div
              className={`h-full rounded-full ${
                product.stock > 10
                  ? "bg-green-500"
                  : product.stock > 0
                    ? "bg-orange-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${Math.min((product.stock / 100) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="text-muted-foreground text-[10px] font-bold whitespace-nowrap uppercase">
            {product.stock > 0 ? `Tồn: ${product.stock}` : "Hết hàng"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 shadow-primary/20 group/btn h-11 w-full rounded-full text-sm font-bold shadow-lg transition-all active:scale-95"
        >
          <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>Xem chi tiết</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
