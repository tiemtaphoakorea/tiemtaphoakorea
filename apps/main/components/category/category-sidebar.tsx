"use client";

import type { ProductFilterCategory } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useFilter } from "./category-filter-context";

interface CategorySidebarProps {
  categories: ProductFilterCategory[];
  activeCategorySlugs: string[];
  basePath: string;
  activeMinPrice?: number;
  activeMaxPrice?: number;
}

const PRICE_RANGES = [
  { id: "all", label: "Tất cả mức giá", min: undefined, max: undefined },
  { id: "lt100", label: "Dưới 100.000đ", min: undefined, max: 100000 },
  { id: "100-300", label: "100.000 – 299.000đ", min: 100000, max: 299000 },
  { id: "300-500", label: "300.000 – 499.000đ", min: 300000, max: 499000 },
  { id: "gt500", label: "Trên 500.000đ", min: 500000, max: undefined },
] as const;

function getActivePriceRangeId(min?: number, max?: number) {
  for (const r of PRICE_RANGES) {
    if (r.id === "all" && min === undefined && max === undefined) return "all";
    if (r.min === min && r.max === max) return r.id;
  }
  return "all";
}

function CategorySidebarInner({
  categories,
  activeCategorySlugs,
  basePath,
  activeMinPrice,
  activeMaxPrice,
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen: isMobileOpen, setIsOpen: setIsMobileOpen } = useFilter();

  const buildParams = () => new URLSearchParams(searchParams.toString());

  const pushParams = (params: URLSearchParams) => {
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  const handleCategoryToggle = (slug: string) => {
    const params = buildParams();
    params.delete("category");
    if (slug) {
      // Toggle: if already selected remove it, otherwise add it alongside existing
      const existing = activeCategorySlugs.filter((s) => s !== slug);
      const next = activeCategorySlugs.includes(slug) ? existing : [...existing, slug];
      for (const s of next) params.append("category", s);
    }
    // If slug is empty ("Tất cả"), clear all — params already deleted above
    pushParams(params);
    if (!slug) setIsMobileOpen(false);
  };

  const handlePriceRangeChange = (id: string) => {
    const range = PRICE_RANGES.find((r) => r.id === id);
    const params = buildParams();
    if (!range || id === "all") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      if (range.min !== undefined) params.set("minPrice", String(range.min));
      else params.delete("minPrice");
      if (range.max !== undefined) params.set("maxPrice", String(range.max));
      else params.delete("maxPrice");
    }
    pushParams(params);
  };

  const handleClearAll = () => {
    router.push(basePath);
    setIsMobileOpen(false);
  };

  const activePriceId = getActivePriceRangeId(activeMinPrice, activeMaxPrice);
  const hasActiveFilter = activeCategorySlugs.length > 0 || activePriceId !== "all";

  const inner = (
    <div className="flex flex-col">
      <SidebarSection title="Danh mục">
        <CategoryCheckbox
          id="cat-all"
          label="Tất cả sản phẩm"
          checked={activeCategorySlugs.length === 0}
          onCheckedChange={() => handleCategoryToggle("")}
        />
        {categories.map((cat) => (
          <CategoryCheckbox
            key={cat.slug}
            id={`cat-${cat.slug}`}
            label={cat.name}
            checked={activeCategorySlugs.includes(cat.slug)}
            onCheckedChange={() => handleCategoryToggle(cat.slug)}
          />
        ))}
      </SidebarSection>

      <Separator />

      <SidebarSection title="Khoảng giá">
        <RadioGroup
          value={activePriceId}
          onValueChange={handlePriceRangeChange}
          className="gap-1.5"
        >
          {PRICE_RANGES.map((range) => (
            <div key={range.id} className="flex items-center gap-2">
              <RadioGroupItem value={range.id} id={`price-${range.id}`} />
              <Label
                htmlFor={`price-${range.id}`}
                className="flex-1 cursor-pointer text-sm font-normal"
              >
                {range.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </SidebarSection>
    </div>
  );

  return (
    <>
      <aside className="sticky top-32 hidden h-fit flex-col gap-4 lg:flex">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <span className="text-sm font-bold text-foreground">Bộ lọc</span>
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
          <CardContent className="px-0 py-0">{inner}</CardContent>
        </Card>
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-[85%] max-w-sm gap-0 p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base font-semibold">Bộ lọc</SheetTitle>
          </SheetHeader>
          <div className="no-scrollbar flex-1 overflow-y-auto">{inner}</div>
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

function SidebarSection({
  title,
  children,
  isLast = false,
}: {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 px-5 py-4 ${isLast ? "" : ""}`}>
      <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function CategoryCheckbox({
  id,
  label,
  count,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  count?: number;
  checked?: boolean;
  onCheckedChange?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label
        htmlFor={id}
        className={`flex-1 cursor-pointer text-sm font-normal ${
          checked ? "font-semibold text-primary" : "text-foreground"
        }`}
      >
        {label}
      </Label>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{count}</span>
      )}
    </div>
  );
}

export function CategorySidebar(props: CategorySidebarProps) {
  return (
    <Suspense fallback={<div className="hidden lg:block" />}>
      <CategorySidebarInner {...props} />
    </Suspense>
  );
}
