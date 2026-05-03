"use client";

import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@workspace/shared/routes";
import { UserCircle2, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { GENERATED_ICONS, GeneratedIcon } from "../sections/generated-icon";
import { MegaMenu, type MegaMenuFeaturedProduct } from "./mega-menu";
import { SearchAutocomplete } from "./search-autocomplete";

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

const NAV_STRIP_ICONS = [
  GENERATED_ICONS.ramen,
  GENERATED_ICONS.beauty,
  GENERATED_ICONS.drinks,
  GENERATED_ICONS.homecare,
  GENERATED_ICONS.gift,
  GENERATED_ICONS.snacks,
  GENERATED_ICONS.wellness,
];

export function Navbar({
  categories = [],
  navCategories = [],
  featuredByCategory = {},
  logoUrl,
}: {
  categories?: Category[];
  navCategories?: Category[];
  featuredByCategory?: Record<string, MegaMenuFeaturedProduct[]>;
  logoUrl?: string;
}) {
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const flag = window.localStorage.getItem("store_customer_logged_in");
      setIsCustomerLoggedIn(flag === "1");
    } catch {
      setIsCustomerLoggedIn(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md">
      {/* Mobile search + actions bar */}
      <div className="flex items-center gap-2 px-4 py-3 md:hidden">
        <Suspense
          fallback={<div className="h-11 flex-1 rounded-full border border-border bg-surface" />}
        >
          <SearchAutocomplete variant="mobile" />
        </Suspense>
        {/* <button
          type="button"
          aria-label="Thông báo"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button> */}
      </div>

      {/* Desktop header row (hidden on mobile) */}
      <div className="container mx-auto hidden h-16 items-center gap-4 px-4 md:flex lg:gap-8">
        <Link href={PUBLIC_ROUTES.HOME} className="group flex shrink-0 items-center gap-2.5">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={140}
              height={36}
              className="max-h-9 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              style={{ height: "auto" }}
              priority
            />
          ) : (
            <>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/50">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                K<span className="text-primary">-</span>SMART
              </span>
            </>
          )}
        </Link>

        <Suspense fallback={<div className="h-10 max-w-md flex-1 rounded-full bg-muted/60" />}>
          <SearchAutocomplete variant="desktop" />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isCustomerLoggedIn && (
            <Link
              href={ACCOUNT_ROUTES.ROOT}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
            >
              <UserCircle2 className="h-3.5 w-3.5" />
              Tài khoản
            </Link>
          )}
        </div>
      </div>

      {/* Desktop category nav */}
      <div className="hidden border-t border-border/60 bg-background/80 md:block">
        <div className="container mx-auto flex items-center">
          <MegaMenu
            categories={navCategories.length > 0 ? navCategories : categories}
            featuredByCategory={featuredByCategory}
          />

          <div className="no-scrollbar flex-1 overflow-x-auto">
            <div className="flex items-center gap-1 px-4 py-1.5 whitespace-nowrap">
              {navCategories.slice(0, 7).map((cat, idx) => (
                <NavStripLink
                  key={cat.id}
                  icon={NAV_STRIP_ICONS[idx % NAV_STRIP_ICONS.length]!}
                  label={cat.name}
                  to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavStripLink({
  icon,
  label,
  to,
  accent = false,
}: {
  icon: string;
  label: string;
  to: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={to}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium leading-none transition-colors hover:bg-muted/60 hover:text-primary ${
        accent ? "text-warning" : "text-foreground"
      }`}
    >
      <GeneratedIcon src={icon} className="h-5 w-5 rounded-md object-contain" />
      {label}
    </Link>
  );
}
