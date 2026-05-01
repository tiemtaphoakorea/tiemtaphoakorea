"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

interface ProductPaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  basePath?: string;
}

function ProductPaginationInner({
  totalItems,
  currentPage,
  pageSize,
  basePath = PUBLIC_ROUTES.PRODUCTS,
}: ProductPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const neighbors = [currentPage - 1, currentPage, currentPage + 1].filter(
      (p) => p > 1 && p < totalPages,
    );
    const sorted = Array.from(new Set<number>([1, ...neighbors, totalPages])).sort((a, b) => a - b);
    const output: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const page = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && prev && page - prev > 1) output.push("ellipsis");
      output.push(page);
    }
    return output;
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 py-2"
      aria-label="Phân trang"
    >
      <Button
        variant="outline"
        size="icon-lg"
        data-testid="pagination-prev"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
        aria-label="Trang trước"
        className="rounded-xl"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="grid size-9 place-items-center text-sm text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon-lg"
            data-testid={`pagination-page-${page}`}
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Trang ${page}`}
            className="rounded-xl text-sm font-semibold"
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon-lg"
        data-testid="pagination-next"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
        aria-label="Trang sau"
        className="rounded-xl"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

export function ProductPagination(props: ProductPaginationProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductPaginationInner {...props} />
    </Suspense>
  );
}
