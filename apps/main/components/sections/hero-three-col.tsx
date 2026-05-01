import { getNavCategoriesWithCounts } from "@workspace/database/services/category.server";
import { getNewArrivals } from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

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

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export async function HeroThreeCol() {
  const [cats, newProducts] = await Promise.all([getNavCategoriesWithCounts(), getNewArrivals(8)]);

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
                  <GeneratedIcon src={c.icon} className="h-5 w-5 rounded-md object-cover" />
                </span>
                <span className="flex-1">{c.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </aside>

          {/* New arrivals panel */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-sm font-bold text-foreground">Hàng mới về</span>
              <Link
                href={PUBLIC_ROUTES.PRODUCTS}
                className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Xem tất cả
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-px bg-border">
              {newProducts.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={PUBLIC_ROUTES.PRODUCT_DETAIL(p.slug)}
                  className="group flex flex-col gap-2 bg-card p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 1280px) 15vw, 180px"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium leading-tight text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-bold text-primary">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
