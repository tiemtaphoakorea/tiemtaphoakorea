"use client";

import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Input } from "@workspace/ui/components/input";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@workspace/ui/components/menubar";
import { AlignLeft, Search, UserCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

export function Navbar({
  categories = [],
  navCategories,
}: {
  categories?: Category[];
  navCategories?: Category[];
}) {
  const pillCategories = navCategories ?? categories;
  const router = useRouter();
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const flag = window.localStorage.getItem("store_customer_logged_in");
      setIsCustomerLoggedIn(flag === "1");
    } catch {
      setIsCustomerLoggedIn(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const to = q ? `${PUBLIC_ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}` : PUBLIC_ROUTES.PRODUCTS;
    router.push(to);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 shadow-sm backdrop-blur-md dark:border-border/50 dark:bg-card/95">
      {/* Main Header Row */}
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 lg:gap-8">
        {/* Logo */}
        <Link href={PUBLIC_ROUTES.HOME} className="group flex shrink-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/50">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            K<span className="text-primary">-</span>SMART
          </span>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="group relative hidden max-w-md flex-1 md:flex"
          role="search"
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Tìm sản phẩm Hàn Quốc..."
            aria-label="Tìm kiếm sản phẩm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border-border bg-muted/60 pl-10 pr-4 text-sm transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10"
          />
        </form>

        {/* Right Nav */}
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

      {/* Category Nav */}
      <div className="border-t border-border/60 bg-background/80 dark:bg-card/60">
        <div className="container mx-auto flex items-center">
          {/* Danh mục — Menubar */}
          <Menubar className="h-auto rounded-none border-none border-r border-border/60 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-none border-r border-border/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground transition-colors hover:text-primary aria-expanded:bg-transparent aria-expanded:text-primary">
                <AlignLeft className="h-4 w-4 stroke-[2.5]" />
                Danh mục
              </MenubarTrigger>
              <MenubarContent
                align="start"
                sideOffset={0}
                className="max-h-[70vh] min-w-56 overflow-y-auto rounded-xl p-1.5 shadow-xl"
              >
                {categories.map((cat) => {
                  const hasChildren = (cat.children?.length ?? 0) > 0;
                  return (
                    <div key={cat.id}>
                      {hasChildren ? (
                        <MenubarSub>
                          <MenubarSubTrigger
                            className="w-full cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
                            onClick={() =>
                              router.push(PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug))
                            }
                          >
                            {cat.name}
                          </MenubarSubTrigger>
                          <MenubarSubContent className="min-w-48 rounded-xl p-1.5 shadow-xl">
                            {cat.children!.map((child) => (
                              <MenubarItem
                                key={child.id}
                                className="cursor-pointer rounded-md px-3 py-2 text-sm"
                                onSelect={() =>
                                  router.push(PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(child.slug))
                                }
                              >
                                {child.name}
                              </MenubarItem>
                            ))}
                          </MenubarSubContent>
                        </MenubarSub>
                      ) : (
                        <MenubarItem
                          className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
                          onSelect={() => router.push(PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug))}
                        >
                          {cat.name}
                        </MenubarItem>
                      )}
                    </div>
                  );
                })}
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          {/* Scrollable category pills */}
          <div className="no-scrollbar flex-1 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 whitespace-nowrap">
              {pillCategories.map((cat) => (
                <CategoryLink
                  key={cat.id}
                  label={cat.name}
                  to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug)}
                />
              ))}
              {pillCategories.length > 0 && <div className="mx-1 h-4 w-px bg-border" />}
              <CategoryLink label="Bán chạy" to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("rating")} />
              <CategoryLink label="Hàng mới" to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("latest")} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function CategoryLink({
  label,
  to = PUBLIC_ROUTES.PRODUCTS,
  highlight = false,
}: {
  label: string;
  to?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={to}
      className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${
        highlight
          ? "border border-orange-200 bg-orange-100 text-orange-600 hover:border-orange-500 hover:bg-orange-500 hover:text-white"
          : "text-muted-foreground hover:bg-accent hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}
