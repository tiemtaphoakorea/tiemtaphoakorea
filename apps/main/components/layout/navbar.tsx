"use client";

import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Input } from "@workspace/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
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

export function Navbar({ categories = [] }: { categories?: Category[] }) {
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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-sm dark:bg-card/95 dark:border-border/50">
      {/* Main Header Row */}
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 lg:gap-8">
        {/* Logo */}
        <Link href={PUBLIC_ROUTES.HOME} className="group flex shrink-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30 transition-all duration-300 group-hover:shadow-primary/50 group-hover:scale-105">
            <Zap className="h-5 w-5 text-white fill-white" />
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
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Tìm sản phẩm Hàn Quốc..."
            aria-label="Tìm kiếm sản phẩm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border-border bg-muted/60 pl-10 pr-4 text-sm transition-all focus:bg-background focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </form>

        {/* Right Nav */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isCustomerLoggedIn && (
            <Link
              href={ACCOUNT_ROUTES.ROOT}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
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
          {/* Danh mục — Popover (renders in a portal, no clipping) */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex shrink-0 items-center gap-2.5 border-r border-border/60 px-5 py-2.5 text-[11px] font-bold tracking-widest text-foreground uppercase transition-colors hover:text-primary">
                <AlignLeft className="h-4 w-4 stroke-[2.5]" />
                Danh mục
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={0} className="w-64 rounded-xl p-0 shadow-xl">
              <div className="border-b border-border/60 px-4 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tất cả danh mục
                </span>
              </div>
              <div className="py-1.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug)}
                    className="group flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary/60">
                        {cat.children.length}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Scrollable category links */}
          <div className="no-scrollbar flex-1 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 whitespace-nowrap">
              {categories.map((cat) => (
                <CategoryLink
                  key={cat.id}
                  label={cat.name}
                  to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(cat.slug)}
                />
              ))}
              {categories.length > 0 && <div className="mx-1 h-4 w-px bg-border" />}
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
          ? "bg-orange-100 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500"
          : "text-muted-foreground hover:bg-accent hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}
