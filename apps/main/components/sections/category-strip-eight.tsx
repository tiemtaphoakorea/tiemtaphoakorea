import { getNavCategoriesWithCounts } from "@workspace/database/services/category.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

const ICON_PALETTE = [
  { icon: GENERATED_ICONS.ramen, bg: "#EEF2FF" },
  { icon: GENERATED_ICONS.snacks, bg: "#FEF3C7" },
  { icon: GENERATED_ICONS.beauty, bg: "#FEE2E2" },
  { icon: GENERATED_ICONS.drinks, bg: "#DBEAFE" },
  { icon: GENERATED_ICONS.homecare, bg: "#F8FAFC" },
  { icon: GENERATED_ICONS.gift, bg: "#FCE7F3" },
  { icon: GENERATED_ICONS.wellness, bg: "#DCFCE7" },
  { icon: GENERATED_ICONS.voucher, bg: "#FEF9C3" },
];

function pickIcon(slug: string, idx: number) {
  const fromIdx = ICON_PALETTE[idx % ICON_PALETTE.length];
  // Stable per-slug fallback in case the index isn't meaningful.
  const hash = Array.from(slug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return fromIdx ?? ICON_PALETTE[hash % ICON_PALETTE.length]!;
}

export async function CategoryStripEight() {
  const cats = await getNavCategoriesWithCounts();
  const items = cats.slice(0, 8);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="container mx-auto px-4 py-6 md:py-9">
        <SectionTitle title="Mua theo danh mục" sub="Chọn đúng danh mục bạn cần" />
        <div className="grid grid-cols-4 gap-2 md:gap-2.5 lg:grid-cols-8">
          {items.map((item, idx) => {
            const visual = pickIcon(item.slug, idx);
            return (
              <Link
                key={item.id}
                href={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(item.slug)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white px-2 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EEF2FF] hover:shadow-md md:gap-2 md:px-3.5 md:py-[18px]"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl md:h-[60px] md:w-[60px] md:rounded-[18px]"
                  style={{ background: visual.bg }}
                >
                  <GeneratedIcon
                    src={visual.icon}
                    className="h-9 w-9 rounded-lg object-cover md:h-11 md:w-11 md:rounded-xl"
                  />
                </span>
                <b className="text-[11px] font-semibold leading-tight text-foreground md:text-[13px]">
                  {item.name}
                </b>
                <small className="hidden text-[11px] font-normal leading-none text-muted-foreground md:block">
                  {item.productCount} sản phẩm
                </small>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({
  kr,
  iconSrc,
  title,
  sub,
  more,
  moreHref,
}: {
  kr?: string;
  iconSrc?: string;
  title: string;
  sub?: string;
  more?: string;
  moreHref?: string;
}) {
  return (
    <div className="mb-[18px] flex items-end justify-between gap-6">
      <div>
        <h2 className="m-0 inline-flex items-center gap-2.5 text-2xl font-bold leading-tight tracking-[-0.02em] text-foreground">
          {kr ? (
            <span
              className="text-[20px] font-bold text-primary"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {kr}
            </span>
          ) : null}
          {iconSrc ? (
            <GeneratedIcon src={iconSrc} className="h-7 w-7 rounded-lg object-cover" />
          ) : null}
          {title}
        </h2>
        {sub ? (
          <small className="mt-1.5 block text-[13px] font-normal leading-snug text-muted-foreground">
            {sub}
          </small>
        ) : null}
      </div>
      {more && moreHref ? (
        <a href={moreHref} className="text-[13px] font-semibold leading-none text-primary">
          {more} →
        </a>
      ) : null}
    </div>
  );
}
