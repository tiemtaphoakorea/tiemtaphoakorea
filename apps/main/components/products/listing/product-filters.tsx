"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import type { ProductFilterCategory } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { ChevronDown, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

interface ProductFiltersProps {
  categories: ProductFilterCategory[];
  activeCategorySlug: string;
}

function ProductFiltersInner({ categories, activeCategorySlug }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    if (!categorySlug) params.delete("category");
    else params.set("category", categorySlug);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
    setIsMobileOpen(false);
  };

  const handleClearAll = () => {
    router.push(PUBLIC_ROUTES.PRODUCTS);
    setIsMobileOpen(false);
  };

  const scrollToChat = () => {
    document.getElementById("store-realtime-chat")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasActiveFilter = Boolean(activeCategorySlug);

  const categoryTree = (
    <CategoryTree
      categories={categories}
      activeCategorySlug={activeCategorySlug}
      expandedSlugs={expandedSlugs}
      onToggleExpanded={toggleExpanded}
      onCategoryChange={handleCategoryChange}
    />
  );

  return (
    <>
      {/* Sidebar Filters - Desktop */}
      <aside className="sticky top-32 hidden h-fit flex-col gap-4 lg:flex">
        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-sm font-bold text-foreground">Bộ lọc</CardTitle>
            {hasActiveFilter && (
              <Button
                variant="link"
                size="xs"
                onClick={handleClearAll}
                className="h-auto px-0 text-xs font-medium"
              >
                Xóa tất cả
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 py-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục
            </h4>
            {categoryTree}
          </CardContent>
        </Card>

        <Card className="gap-2 bg-secondary py-0 ring-0">
          <CardContent className="px-5 py-5">
            <h4 className="mb-2 text-sm font-bold text-primary">Cần tư vấn?</h4>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Đội ngũ K-SMART sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToChat}
              className="w-full rounded-full border-primary/30 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Chat với chúng tôi
            </Button>
          </CardContent>
        </Card>
      </aside>

      {/* Mobile filter trigger + sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <div className="mb-1 flex lg:hidden">
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="gap-2 rounded-full">
              <Filter className="size-4" /> Bộ lọc
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent side="left" className="w-[85%] max-w-sm gap-0 p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base font-semibold">Bộ lọc</SheetTitle>
          </SheetHeader>

          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-4">
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Danh mục
              </h4>
              {categoryTree}
            </div>
          </div>

          <Separator />
          <SheetFooter className="px-6 py-4">
            {hasActiveFilter && (
              <Button variant="ghost" size="lg" onClick={handleClearAll}>
                Xóa bộ lọc
              </Button>
            )}
            <Button
              size="lg"
              className="h-12 w-full rounded-2xl font-bold"
              onClick={() => setIsMobileOpen(false)}
            >
              Xem kết quả
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CategoryTree({
  categories,
  activeCategorySlug,
  expandedSlugs,
  onToggleExpanded,
  onCategoryChange,
}: {
  categories: ProductFilterCategory[];
  activeCategorySlug: string;
  expandedSlugs: Set<string>;
  onToggleExpanded: (slug: string) => void;
  onCategoryChange: (slug: string) => void;
}) {
  return (
    <div className="space-y-1">
      <CategoryRow
        name="Tất cả sản phẩm"
        slug=""
        active={activeCategorySlug === ""}
        onClick={onCategoryChange}
      />
      {categories.map((cat) => {
        const hasChildren = (cat.children?.length ?? 0) > 0;
        const isExpanded = expandedSlugs.has(cat.slug);
        return (
          <div key={cat.slug}>
            <div className="flex items-center gap-1">
              <CategoryRow
                name={cat.name}
                slug={cat.slug}
                active={activeCategorySlug === cat.slug}
                onClick={onCategoryChange}
                className="flex-1"
              />
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onToggleExpanded(cat.slug)}
                  aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                  className="text-muted-foreground"
                >
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
                {cat.children!.map((child) => (
                  <CategoryRow
                    key={child.slug}
                    name={child.name}
                    slug={child.slug}
                    active={activeCategorySlug === child.slug}
                    onClick={onCategoryChange}
                    isChild
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryRow({
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
    <Button
      variant="ghost"
      size="lg"
      onClick={() => onClick(slug)}
      className={`h-auto w-full justify-start gap-2 rounded-lg px-2.5 py-2 text-left font-medium ${
        isChild ? "text-xs" : "text-sm"
      } ${
        active
          ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary"
          : "text-foreground"
      } ${className}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
        aria-hidden
      />
      <span className="flex-1 truncate">{name}</span>
    </Button>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductFiltersInner {...props} />
    </Suspense>
  );
}
