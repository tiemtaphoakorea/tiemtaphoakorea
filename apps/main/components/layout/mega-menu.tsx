"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GENERATED_ICONS, GeneratedIcon } from "../sections/generated-icon";

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

const ICON_PALETTE = [
  { icon: GENERATED_ICONS.ramen, bg: "#FFD9DB" },
  { icon: GENERATED_ICONS.snacks, bg: "#FFE4D2" },
  { icon: GENERATED_ICONS.drinks, bg: "#DCE6F8" },
  { icon: GENERATED_ICONS.beauty, bg: "#FEE2E2" },
  { icon: GENERATED_ICONS.beauty, bg: "#FEF9C3" },
  { icon: GENERATED_ICONS.homecare, bg: "#FEF3C7" },
  { icon: GENERATED_ICONS.gift, bg: "#FCE7F3" },
  { icon: GENERATED_ICONS.flash, bg: "#FEF9C3" },
  { icon: GENERATED_ICONS.voucher, bg: "#EEF2FF" },
];

const SUBCAT_PALETTE = [
  "#FFD9DB",
  "#FEF9C3",
  "#FFE4D2",
  "#FEF3C7",
  "#FFF3BF",
  "#DCFCE7",
  "#DCE6F8",
  "#EEF2FF",
];

function categoryHref(slug: string) {
  return PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(slug);
}

function MegaMenuTrigger({ open, onActivate }: { open: boolean; onActivate: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onFocus={onActivate}
      data-state={open ? "open" : "closed"}
      className={`group relative inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-t-sm px-5 py-3 text-[14px] font-semibold leading-none tracking-[-0.005em] transition-all duration-200 ease-out ${
        open
          ? "bg-[#E0E7FF] text-primary shadow-[inset_0_-2px_0_var(--primary)]"
          : "text-foreground hover:bg-muted/60 hover:text-primary"
      }`}
    >
      <TriggerHamburger open={open} />
      <span>Tất cả danh mục</span>
    </button>
  );
}

function TriggerHamburger({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[18px] w-[18px] flex-col justify-center gap-[3px] transition-colors ${
        open ? "text-primary" : "text-foreground group-hover:text-primary"
      }`}
    >
      <span className="block h-[2px] w-full rounded-full bg-current" />
      <span className="block h-[2px] w-full rounded-full bg-current" />
      <span className="block h-[2px] w-full rounded-full bg-current" />
    </span>
  );
}

export function MegaMenu({ categories = [] }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  if (categories.length === 0) {
    return (
      <div className="relative">
        <MegaMenuTrigger open={false} onActivate={() => {}} />
      </div>
    );
  }

  const activeCategory = categories[active] ?? categories[0]!;
  const activeVisual = ICON_PALETTE[active % ICON_PALETTE.length]!;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <MegaMenuTrigger open={open} onActivate={() => setOpen(true)} />

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 w-[1000px] overflow-hidden rounded-b-3xl rounded-tr-3xl border border-border bg-white shadow-2xl"
        >
          <div className="grid grid-cols-[260px_1fr]">
            {/* Left rail: top-level categories */}
            <ul className="m-0 flex list-none flex-col gap-0.5 p-3">
              {categories.map((item, i) => {
                const isActive = i === active;
                const visual = ICON_PALETTE[i % ICON_PALETTE.length]!;
                return (
                  <li key={item.id}>
                    <Link
                      href={categoryHref(item.slug)}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isActive ? "bg-[#EEF2FF]" : "hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                        style={{ background: visual.bg }}
                      >
                        <GeneratedIcon
                          src={visual.icon}
                          className="h-7 w-7 rounded-lg object-contain"
                        />
                      </span>
                      <span
                        className={`flex-1 text-[14px] font-medium leading-tight ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {item.name}
                      </span>
                      {isActive ? <ChevronRight className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Right content: active category's children (subcategories) */}
            <div className="flex flex-col gap-5 border-l border-border bg-white p-6">
              <div className="flex items-center justify-between">
                <h4 className="m-0 text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-muted-foreground">
                  <GeneratedIcon
                    src={activeVisual.icon}
                    className="mr-1 inline-block h-5 w-5 rounded-md object-contain align-middle"
                  />
                  {activeCategory.name.toUpperCase()}
                </h4>
                <Link
                  href={categoryHref(activeCategory.slug)}
                  className="text-[13px] font-semibold leading-none text-primary"
                >
                  Xem tất cả →
                </Link>
              </div>

              {activeCategory.children && activeCategory.children.length > 0 ? (
                <div className="grid grid-cols-3 gap-x-5 gap-y-2.5">
                  {activeCategory.children.map((sc, scIdx) => (
                    <Link
                      key={sc.id}
                      href={categoryHref(sc.slug)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                        style={{ background: SUBCAT_PALETTE[scIdx % SUBCAT_PALETTE.length] }}
                      >
                        <GeneratedIcon
                          src={activeVisual.icon}
                          className="h-7 w-7 rounded-lg object-contain"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold leading-tight text-foreground">
                          {sc.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Chưa có danh mục con. Bấm vào để xem tất cả sản phẩm trong{" "}
                  <span className="font-semibold text-foreground">{activeCategory.name}</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
