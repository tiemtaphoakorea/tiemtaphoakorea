"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Heart, PackageOpen, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <section className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
          <PackageOpen className="h-9 w-9 text-rose-400" />
        </div>
        <h1 className="text-foreground text-2xl font-black">Danh sách yêu thích trống</h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          Bấm vào biểu tượng trái tim trên sản phẩm để lưu vào đây nhé!
        </p>
        <Link
          href={PUBLIC_ROUTES.PRODUCTS}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-600"
        >
          <Heart className="h-4 w-4" />
          Khám phá sản phẩm
        </Link>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Yêu thích</h1>
          <p className="text-muted-foreground mt-1 text-sm">{items.length} sản phẩm đã lưu</p>
        </div>
        <button
          type="button"
          onClick={clearWishlist}
          className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
          >
            <Link
              href={item.slug ? PUBLIC_ROUTES.PRODUCT_DETAIL(item.slug) : PUBLIC_ROUTES.PRODUCTS}
              className="relative block aspect-square overflow-hidden bg-gray-50"
            >
              <Image
                src={item.image || "/placeholder.png"}
                alt={item.name}
                fill
                priority={i < 4}
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </Link>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Bỏ yêu thích ${item.name}`}
              className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
            <div className="p-3">
              <Link
                href={item.slug ? PUBLIC_ROUTES.PRODUCT_DETAIL(item.slug) : PUBLIC_ROUTES.PRODUCTS}
                className="text-foreground line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
              >
                {item.name}
              </Link>
              <p className="text-primary mt-1.5 text-sm font-bold">
                {item.price.toLocaleString("vi-VN")}₫
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
