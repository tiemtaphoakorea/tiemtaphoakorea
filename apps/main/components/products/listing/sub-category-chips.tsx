"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import type { ProductFilterCategory } from "@workspace/shared/types/product";
import { Button } from "@workspace/ui/components/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface SubCategoryChipsProps {
  categories: ProductFilterCategory[];
  activeCategorySlug: string;
  basePath?: string;
}

function SubCategoryChipsInner({
  categories,
  activeCategorySlug,
  basePath = PUBLIC_ROUTES.PRODUCTS,
}: SubCategoryChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) params.delete("category");
    else params.set("category", slug);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  const items: ProductFilterCategory[] = [{ name: "Tất cả", slug: "" }, ...categories];

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((cat) => {
        const active = activeCategorySlug === cat.slug;
        return (
          <Button
            key={cat.slug || "_all"}
            variant={active ? "default" : "outline"}
            size="lg"
            onClick={() => handleClick(cat.slug)}
            className="h-9 flex-shrink-0 rounded-full px-4 text-sm font-medium"
          >
            {cat.name}
          </Button>
        );
      })}
    </div>
  );
}

export function SubCategoryChips(props: SubCategoryChipsProps) {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <SubCategoryChipsInner {...props} />
    </Suspense>
  );
}
