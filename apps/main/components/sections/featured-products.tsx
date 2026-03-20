"use client";

import { PUBLIC_ROUTES } from "@repo/shared/routes";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
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
      className="bg-background py-12"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Sản phẩm nổi bật</h2>
            <p className="text-sm text-muted-foreground">Những sản phẩm K-Beauty được tin dùng tại Việt Nam</p>
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
      className="py-0 group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-md hover:shadow-primary/10 hover:border-primary/20 dark:bg-card"
    >
      <Link
        href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}
        className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-gray-50"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
          {product.category}
        </span>
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

        {/* Stock Badge */}
        <div className="mt-2">
          {product.stock > 0 ? (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${product.stock > 10 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
              {product.stock > 10 ? "Còn hàng" : `Còn ${product.stock}`}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">Hết hàng</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          asChild
          variant="outline"
          className="h-10 w-full rounded-full border-primary/30 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-all"
        >
          <Link href={PUBLIC_ROUTES.PRODUCT_DETAIL(product.slug)}>Xem chi tiết</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
