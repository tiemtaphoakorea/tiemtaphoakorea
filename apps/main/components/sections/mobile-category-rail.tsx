import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

type RailCategory = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  categories: RailCategory[];
};

const ICON_MAP: Record<string, string> = {
  "an-vat": GENERATED_ICONS.snacks,
  snack: GENERATED_ICONS.snacks,
  mi: GENERATED_ICONS.ramen,
  "mi-an-lien": GENERATED_ICONS.ramen,
  ramen: GENERATED_ICONS.ramen,
  "do-uong": GENERATED_ICONS.drinks,
  drinks: GENERATED_ICONS.drinks,
  "my-pham": GENERATED_ICONS.beauty,
  "k-beauty": GENERATED_ICONS.beauty,
  beauty: GENERATED_ICONS.beauty,
  vitamin: GENERATED_ICONS.wellness,
  "thuc-pham": GENERATED_ICONS.homecare,
  food: GENERATED_ICONS.homecare,
  combo: GENERATED_ICONS.gift,
  qua: GENERATED_ICONS.gift,
  soju: GENERATED_ICONS.drinks,
  bia: GENERATED_ICONS.drinks,
};

function getIcon(slug: string) {
  const key = slug.toLowerCase();
  if (ICON_MAP[key]) return ICON_MAP[key];
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (key.includes(k)) return v;
  }
  return GENERATED_ICONS.gift;
}

export function MobileCategoryRail({ categories }: Props) {
  if (categories.length === 0) return null;

  return (
    <section className="px-4 pt-3 md:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-foreground">Danh mục</h2>
        <Link href={PUBLIC_ROUTES.PRODUCTS} className="text-xs font-semibold text-primary">
          Tất cả →
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Link
          href={PUBLIC_ROUTES.PRODUCTS}
          className="flex min-w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary">
            <GeneratedIcon
              src={GENERATED_ICONS.home}
              className="h-10 w-10 rounded-xl object-cover"
            />
          </div>
          <span className="text-[10px] font-bold leading-tight text-primary">Tất cả</span>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug)}
            className="flex min-w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-soft,#EEF2FF)]">
              <GeneratedIcon
                src={getIcon(cat.slug)}
                className="h-10 w-10 rounded-xl object-cover"
              />
            </div>
            <span className="line-clamp-1 max-w-16 text-center text-[10px] font-medium leading-tight text-muted-foreground">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
