"use client";

import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@repo/shared/routes";
import { Input } from "@repo/ui/components/input";
import { Menu, Search, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Top Header */}
      <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-4 lg:gap-8">
        {/* Logo */}
        <Link href={PUBLIC_ROUTES.HOME} className="group flex shrink-0 items-center gap-2">
          <div className="bg-primary flex h-10 w-10 rotate-3 items-center justify-center rounded-xl transition-transform group-hover:rotate-0">
            <span className="text-2xl leading-none font-bold text-white">K</span>
          </div>
          <div className="flex flex-col">
            <span className="text-primary text-xl leading-none font-bold tracking-tight">
              K-SMART
            </span>
            <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
              Pure Beauty
            </span>
          </div>
        </Link>

        {/* Search Bar - Center */}
        <form
          onSubmit={handleSearchSubmit}
          className="group relative hidden max-w-xl flex-1 md:flex"
          role="search"
        >
          <Input
            type="text"
            placeholder="Tra cứu mỹ phẩm, đồ gia dụng Hàn Quốc..."
            aria-label="Tìm kiếm sản phẩm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary/30 h-11 w-full rounded-full border-gray-100 bg-gray-50 pr-4 pl-12 transition-all focus:bg-white"
          />
          <Search className="group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors" />
        </form>

        {/* Right Nav */}
        <div className="flex shrink-0 items-center gap-3 lg:gap-6">
          {isCustomerLoggedIn && (
            <Link
              href={ACCOUNT_ROUTES.ROOT}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-bold tracking-widest uppercase"
            >
              <UserCircle2 className="h-4 w-4" />
              Account
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="no-scrollbar flex items-center overflow-x-auto border-t border-gray-100 bg-gray-50/50 py-2 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="container mx-auto flex items-center gap-8 px-4 text-sm font-medium whitespace-nowrap">
          <Link
            href={PUBLIC_ROUTES.PRODUCTS}
            className="text-primary group flex items-center gap-2 font-bold"
          >
            <Menu className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" />{" "}
            DANH MỤC
          </Link>
          <CategoryLink
            label="Chăm sóc da"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Chăm sóc da")}
          />
          <CategoryLink label="Trang điểm" to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Trang điểm")} />
          <CategoryLink label="Tẩy trang" to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Tẩy trang")} />
          <CategoryLink label="Sức khỏe" to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Sức khỏe")} />
          <CategoryLink
            label="Đồ gia dụng"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Đồ gia dụng")}
          />
          <CategoryLink label="Khuyến mãi" to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Khuyến mãi")} />
          <CategoryLink label="Bán chạy" to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("rating")} />
          <CategoryLink label="Hàng mới" to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("latest")} />
        </div>
      </div>
    </header>
  );
}

function CategoryLink({ label, to = PUBLIC_ROUTES.PRODUCTS }: { label: string; to?: string }) {
  return (
    <Link
      href={to}
      className="hover:text-primary after:bg-primary relative font-semibold text-gray-600 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:transition-all hover:after:w-full"
    >
      {label}
    </Link>
  );
}
