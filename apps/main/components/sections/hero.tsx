"use server";

import type { BannerSlide } from "@workspace/database/services/banner.server";
import { getBanners } from "@workspace/database/services/banner.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { HeroBannerCarousel } from "./hero-banner-carousel";

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: "default",
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
    id: "skincare",
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
  {
    id: "snacks",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl: "/banners/k-smart-hero-snacks.png",
    title: "SNACK HÀN\nĐẦY KỆ",
    subtitle: "Bánh kẹo, rong biển, trà và pantry Hàn giao nhanh tận nhà.",
    badgeText: "Combo ăn vặt mới",
    ctaLabel: "Mua snack",
    ctaUrl: PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("snacks"),
    ctaSecondaryLabel: "Xem combo",
    discountTag: "2+1",
    discountTagSub: "combo hot",
    accentColor: "green",
    isActive: true,
    sortOrder: 2,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "homecare",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl: "/banners/k-smart-hero-homecare.png",
    title: "NHÀ SẠCH\nNHẸ TÊNH",
    subtitle: "Đồ gia dụng và chăm sóc nhà cửa nhập khẩu, sạch đẹp mỗi ngày.",
    badgeText: "Home care chuẩn Hàn",
    ctaLabel: "Sắm gia dụng",
    ctaUrl: PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("household"),
    ctaSecondaryLabel: "Khám phá thêm",
    discountTag: "25%",
    discountTagSub: "đồ nhà cửa",
    accentColor: "sky",
    isActive: true,
    sortOrder: 3,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "wellness",
    type: "custom",
    categoryId: null,
    categorySlug: null,
    imageUrl: "/banners/k-smart-hero-wellness.png",
    title: "SỐNG KHỎE\nMỖI NGÀY",
    subtitle: "Vitamin, collagen và sản phẩm wellness cho nhịp sống bận rộn.",
    badgeText: "Wellness chọn lọc",
    ctaLabel: "Xem vitamin",
    ctaUrl: PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("beverages"),
    ctaSecondaryLabel: "Sản phẩm mới",
    discountTag: "15%",
    discountTagSub: "wellness",
    accentColor: "orange",
    isActive: true,
    sortOrder: 4,
    startsAt: null,
    endsAt: null,
  },
];

export async function Hero() {
  const bannersData = await getBanners().catch(() => []);
  const slides = bannersData.length > 0 ? bannersData : DEFAULT_SLIDES;

  return (
    <section className="bg-background pb-3 pt-3 md:pb-6 md:pt-6">
      <div className="container mx-auto px-4">
        <HeroBannerCarousel slides={slides} />
      </div>
    </section>
  );
}
