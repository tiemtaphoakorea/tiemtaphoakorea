"use client";

import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { ProductFilterCategory } from "@/types/product";

interface ProductFiltersProps {
  categories: ProductFilterCategory[];
  activeCategorySlug: string;
}

export function ProductFilters({ categories, activeCategorySlug }: ProductFiltersProps) {
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
          <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">Danh mục</h3>
          <div className="space-y-2">
            {categoryList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-all ${
                  activeCategorySlug === cat.slug
                    ? "bg-primary shadow-primary/20 text-white shadow-lg"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="bg-primary/5 border-primary/10 rounded-2xl border p-4">
          <h4 className="text-primary mb-2 text-sm font-bold">Cần tư vấn?</h4>
          <p className="text-muted-foreground mb-4 text-xs font-medium">
            Đội ngũ chuyên gia của K-SMART luôn sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp.
          </p>
          <Button
            variant="outline"
            className="border-primary/20 hover:bg-primary w-full rounded-full text-xs font-bold hover:text-white"
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
          className="border-primary/20 flex-shrink-0 gap-2 rounded-full"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Filter className="h-4 w-4" /> Bộ lọc
        </Button>
        {categoryList.slice(0, 5).map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeCategorySlug === cat.slug
                ? "bg-primary border-primary shadow-primary/20 text-white shadow-md"
                : "text-muted-foreground hover:border-primary/50 border-gray-100 bg-white"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Filter Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-[80%] max-w-sm transform bg-white transition-transform duration-300 lg:hidden ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-black">Bộ lọc</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto">
            <div>
              <h3 className="text-primary mb-4 text-sm font-bold tracking-wider uppercase">
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
