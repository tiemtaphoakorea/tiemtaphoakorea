import { getNavCategoriesWithCounts } from "@workspace/database/services/category.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

const ICONS = [
  GENERATED_ICONS.ramen,
  GENERATED_ICONS.snacks,
  GENERATED_ICONS.beauty,
  GENERATED_ICONS.drinks,
  GENERATED_ICONS.homecare,
  GENERATED_ICONS.gift,
  GENERATED_ICONS.wellness,
  GENERATED_ICONS.voucher,
];

function pickIcon(slug: string, idx: number) {
  const fromIdx = ICONS[idx % ICONS.length];
  const hash = Array.from(slug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return fromIdx ?? ICONS[hash % ICONS.length]!;
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
          {items.map((item, idx) => (
            <Link
              key={item.id}
              href={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(item.slug)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white px-2 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-info-soft hover:shadow-md md:gap-2 md:px-3.5 md:py-4.5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-md md:h-15 md:w-15">
                <GeneratedIcon
                  src={pickIcon(item.slug, idx)}
                  className="h-9 w-9 rounded-md object-contain md:h-11 md:w-11"
                />
              </span>
              <b className="text-xs font-semibold leading-tight text-foreground md:text-sm">
                {item.name}
              </b>
              <small className="hidden text-xs font-normal leading-none text-muted-foreground md:block">
                {item.productCount} sản phẩm
              </small>
            </Link>
          ))}
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
        <h2 className="m-0 inline-flex items-center gap-2.5 text-2xl font-bold leading-tight tracking-tight text-foreground">
          {kr ? (
            <span
              className="text-xl font-bold text-primary"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {kr}
            </span>
          ) : null}
          {iconSrc ? (
            <GeneratedIcon src={iconSrc} className="h-7 w-7 rounded-lg object-contain" />
          ) : null}
          {title}
        </h2>
        {sub ? (
          <small className="mt-1.5 block text-sm font-normal leading-snug text-muted-foreground">
            {sub}
          </small>
        ) : null}
      </div>
      {more && moreHref ? (
        <a href={moreHref} className="text-sm font-semibold leading-none text-primary">
          {more} →
        </a>
      ) : null}
    </div>
  );
}
