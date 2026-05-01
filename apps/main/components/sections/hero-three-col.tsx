import type { BannerSlide } from "@workspace/database/services/banner.server";
import { getBanners } from "@workspace/database/services/banner.server";
import { getNavCategoriesWithCounts } from "@workspace/database/services/category.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";
import { HeroBannerCarousel } from "./hero-banner-carousel";

const SIDE_PALETTE = [
  { icon: GENERATED_ICONS.ramen, bg: "#FFD9DB" },
  { icon: GENERATED_ICONS.snacks, bg: "#FFE4D2" },
  { icon: GENERATED_ICONS.snacks, bg: "#FFF3BF" },
  { icon: GENERATED_ICONS.drinks, bg: "#DCE6F8" },
  { icon: GENERATED_ICONS.drinks, bg: "#D5F2E5" },
  { icon: GENERATED_ICONS.beauty, bg: "#FFD9DB" },
  { icon: GENERATED_ICONS.beauty, bg: "#FFE4D2" },
  { icon: GENERATED_ICONS.homecare, bg: "#FFF3BF" },
  { icon: GENERATED_ICONS.gift, bg: "#DCE6F8" },
];

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
  const [cats, bannersData] = await Promise.all([
    getNavCategoriesWithCounts(),
    getBanners().catch(() => []),
  ]);

  const slides = bannersData.length > 0 ? bannersData : FALLBACK_SLIDES;

  const sideCats = cats.slice(0, 9).map((c, idx) => ({
    label: c.name,
    href: PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(c.slug),
    icon: SIDE_PALETTE[idx % SIDE_PALETTE.length]!.icon,
    bg: SIDE_PALETTE[idx % SIDE_PALETTE.length]!.bg,
  }));

  return (
    <section className="hidden md:block">
      <div className="container mx-auto px-4 pb-7 pt-6">
        <div className="grid grid-cols-[240px_1fr] gap-4">
          {/* Side categories */}
          <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-2">
            <h4 className="m-0 px-3 pt-3 pb-2 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground">
              Mua nhiều
            </h4>
            {sideCats.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group flex items-center gap-2.5 rounded-xl px-2.5 py-[9px] text-[13px] font-medium leading-tight text-foreground transition-colors hover:bg-[#EEF2FF] hover:text-primary"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: c.bg }}
                >
                  <GeneratedIcon src={c.icon} className="h-5 w-5 rounded-md object-contain" />
                </span>
                <span className="flex-1">{c.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </aside>

          {/* Hero banner */}
          <HeroBannerCarousel slides={slides} heightClass="h-[420px] lg:h-[460px]" />
        </div>
      </div>
    </section>
  );
}
