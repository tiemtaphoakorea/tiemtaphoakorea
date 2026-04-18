"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import type { ProductFilterCategory } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { ChevronDown, Filter, X } from "lucide-react";
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

  // Auto-expand the parent of the active category
  const initialExpanded = new Set(
    categories
      .filter(
        (cat) =>
          cat.slug === activeCategorySlug ||
          cat.children?.some((c) => c.slug === activeCategorySlug),
      )
      .map((cat) => cat.slug),
  );
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(initialExpanded);

  const toggleExpanded = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

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
          <div className="space-y-0.5">
            {/* "Tất cả" */}
            <CategoryFilterItem
              name="Tất cả"
              slug=""
              active={activeCategorySlug === ""}
              onClick={handleCategoryChange}
            />
            {categories.map((cat) => {
              const hasChildren = (cat.children?.length ?? 0) > 0;
              const isExpanded = expandedSlugs.has(cat.slug);
              return (
                <div key={cat.slug}>
                  <div className="flex items-center">
                    <CategoryFilterItem
                      name={cat.name}
                      slug={cat.slug}
                      active={activeCategorySlug === cat.slug}
                      onClick={handleCategoryChange}
                      className="flex-1"
                    />
                    {hasChildren && (
                      <button
                        onClick={() => toggleExpanded(cat.slug)}
                        className="mr-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="ml-3 border-l border-border/50 pl-2">
                      {cat.children!.map((child) => (
                        <CategoryFilterItem
                          key={child.slug}
                          name={child.name}
                          slug={child.slug}
                          active={activeCategorySlug === child.slug}
                          onClick={handleCategoryChange}
                          isChild
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
        {[{ name: "Tất cả", slug: "" }, ...categories].slice(0, 5).map((cat) => (
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
              <div className="grid grid-cols-1 gap-1">
                {[
                  { name: "Tất cả", slug: "", children: [] as ProductFilterCategory[] },
                  ...categories,
                ].map((cat) => {
                  const hasChildren = (cat.children?.length ?? 0) > 0;
                  const isExpanded = expandedSlugs.has(cat.slug);
                  return (
                    <div key={cat.slug}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCategoryChange(cat.slug)}
                          className={`flex-1 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${
                            activeCategorySlug === cat.slug
                              ? "bg-primary text-white"
                              : "bg-gray-50 text-muted-foreground"
                          }`}
                        >
                          {cat.name}
                        </button>
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpanded(cat.slug)}
                            className="rounded-2xl bg-gray-50 p-3 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      {hasChildren && isExpanded && (
                        <div className="mt-1 ml-4 space-y-1">
                          {cat.children!.map((child) => (
                            <button
                              key={child.slug}
                              onClick={() => handleCategoryChange(child.slug)}
                              className={`w-full rounded-xl px-4 py-2 text-left text-sm transition-all ${
                                activeCategorySlug === child.slug
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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

function CategoryFilterItem({
  name,
  slug,
  active,
  onClick,
  isChild = false,
  className = "",
}: {
  name: string;
  slug: string;
  active: boolean;
  onClick: (slug: string) => void;
  isChild?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={() => onClick(slug)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
        isChild ? "text-xs" : "text-sm"
      } ${
        active
          ? "font-semibold text-primary"
          : "font-medium text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
      />
      {name}
    </button>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductFiltersInner {...props} />
    </Suspense>
  );
}
