"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import type { ProductFilterCategory } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

interface ProductFiltersProps {
  categories: ProductFilterCategory[];
  activeCategorySlug: string;
}

function ProductFiltersInner({ categories, activeCategorySlug }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const categoryList = [{ name: "Tất cả", slug: "" }, ...categories];

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!categorySlug) {
      params.delete("category");
    } else {
      params.set("category", categorySlug);
    }
    // Reset page on category change
    params.delete("page");

    router.push(`${PUBLIC_ROUTES.PRODUCTS}?${params.toString()}`);
    setIsMobileSidebarOpen(false);
  };

  const scrollToChat = () => {
    document.getElementById("store-realtime-chat")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Sidebar Filters - Desktop */}
      <aside className="sticky top-32 hidden h-fit w-64 space-y-8 lg:block">
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Danh mục
          </h3>
          <div className="space-y-2">
            {categoryList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  activeCategorySlug === cat.slug
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeCategorySlug === cat.slug ? "bg-primary" : "bg-transparent"}`}
                />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="rounded-2xl bg-secondary p-4">
          <h4 className="mb-2 text-sm font-semibold text-primary">Cần tư vấn?</h4>
          <p className="mb-4 text-xs text-muted-foreground">
            Đội ngũ chuyên gia của K-SMART luôn sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-full border-primary/30 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
            onClick={scrollToChat}
          >
            Chat với chúng tôi
          </Button>
        </div>
      </aside>

      {/* Mobile Filter Toggle & Quick Categories */}
      <div className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto pb-2 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-2 rounded-full border-border"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Filter className="h-4 w-4" /> Bộ lọc
        </Button>
        {categoryList.slice(0, 5).map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
              activeCategorySlug === cat.slug
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileSidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsMobileSidebarOpen(false);
          }}
        />
      )}

      {/* Mobile Filter Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-[80%] max-w-sm transform bg-white transition-transform duration-300 lg:hidden ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-base font-semibold">Bộ lọc</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Danh mục
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {categoryList.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${
                      activeCategorySlug === cat.slug
                        ? "bg-primary text-white"
                        : "text-muted-foreground bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-auto border-t pt-6">
            <Button
              className="h-12 w-full rounded-2xl font-bold"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              Xem kết quả
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductFiltersInner {...props} />
    </Suspense>
  );
}
