"use server";

import { getBanners } from "@workspace/database/services/banner.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { HeroBannerCarousel } from "./hero-banner-carousel";
import type { BannerSlide } from "@workspace/database/services/banner.server";

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: "default",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl:
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=2000",
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
];

export async function Hero() {
  const bannersData = await getBanners().catch(() => []);
  const slides = bannersData.length > 0 ? bannersData : DEFAULT_SLIDES;

  return (
    <section className="bg-background pb-6 pt-6">
      <div className="container mx-auto px-4">
        <HeroBannerCarousel slides={slides} />
      </div>
    </section>
  );
}
