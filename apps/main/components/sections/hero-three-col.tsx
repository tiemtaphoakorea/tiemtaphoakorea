import type { BannerSlide } from "@workspace/database/services/banner.server";
import { getBanners } from "@workspace/database/services/banner.server";
import { getBestSellers } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Image from "next/image";
import Link from "next/link";
import { HeroBannerCarousel } from "./hero-banner-carousel";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: "fallback-default",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl: "/banners/k-smart-hero-fallback.png",
    title: "NÂNG TẦM\nVẺ ĐẸP HÀN",
    subtitle: "Ưu đãi đến 50% các dòng mỹ phẩm cao cấp. Nhập khẩu trực tiếp từ Seoul.",
    badgeText: "Hàng chính hãng từ Seoul",
    ctaLabel: "Mua ngay",
    ctaUrl: PUBLIC_ROUTES.PRODUCTS,
    ctaSecondaryLabel: "Khám phá thêm",
    discountTag: "50%",
    discountTagSub: "cho đơn đầu tiên",
    accentColor: "violet",
    isActive: true,
    sortOrder: 0,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "fallback-skincare",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl: "/banners/k-smart-hero-skincare.png",
    title: "CHĂM DA\nCHUẨN SEOUL",
    subtitle: "Routine Hàn Quốc cho làn da căng khỏe, sáng mịn mỗi ngày.",
    badgeText: "Skincare chính hãng",
    ctaLabel: "Xem mỹ phẩm",
    ctaUrl: PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("personal-care"),
    ctaSecondaryLabel: "Tư vấn routine",
    discountTag: "35%",
    discountTagSub: "skincare chọn lọc",
    accentColor: "rose",
    isActive: true,
    sortOrder: 1,
    startsAt: null,
    endsAt: null,
  },
];

export async function HeroThreeCol() {
  const [bestSellers, bannersData] = await Promise.all([
    getBestSellers(8),
    getBanners().catch(() => []),
  ]);

  const slides = bannersData.length > 0 ? bannersData : FALLBACK_SLIDES;

  const topProducts = bestSellers.map((p) => {
    const minPrice = p.minPrice ?? parseFloat(p.basePrice ?? "0");
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: minPrice,
      thumbnail: p.thumbnail || "/placeholder.png",
    };
  });

  return (
    <section className="hidden md:block">
      <div className="container mx-auto px-4 pb-7 pt-6">
        <div className="grid grid-cols-[300px_1fr] gap-4">
          {/* Best sellers sidebar */}
          <aside className="flex flex-col rounded-2xl border border-border bg-white p-2">
            <h4 className="m-0 flex items-center justify-between px-3 pt-3 pb-2 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground">
              <span>Mua nhiều</span>
              <Link
                href={PUBLIC_ROUTES.PRODUCTS_BY_SORT(PRODUCT_SORT.POPULAR)}
                className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground/80 hover:text-primary"
              >
                Xem tất cả
              </Link>
            </h4>
            {topProducts.map((p, idx) => (
              <Link
                key={p.id}
                href={PUBLIC_ROUTES.PRODUCT_DETAIL(p.slug)}
                className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#EEF2FF]"
              >
                <span className="relative shrink-0 h-10 w-10">
                  <span className="absolute inset-0 overflow-hidden rounded-lg bg-secondary">
                    {p.thumbnail && (
                      <Image
                        src={p.thumbnail}
                        alt={p.name}
                        fill
                        priority={idx < 3}
                        className="object-contain"
                        sizes="40px"
                      />
                    )}
                  </span>
                  <span className="absolute -left-1 -top-1 z-10 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {idx + 1}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium leading-tight text-foreground group-hover:text-primary">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-primary">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </aside>

          {/* Hero banner */}
          <HeroBannerCarousel
            slides={slides}
            heightClass="h-full min-h-[430px] lg:min-h-[480px] 2xl:aspect-[16/9] 2xl:min-h-0"
          />
        </div>
      </div>
    </section>
  );
}
