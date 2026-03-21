"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

interface ProductPaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

function ProductPaginationInner({ totalItems, currentPage, pageSize }: ProductPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const neighbors = [currentPage - 1, currentPage, currentPage + 1].filter(
      (p) => p > 1 && p < totalPages,
    );
    const pageSet = new Set<number>([1, ...neighbors, totalPages]);
    const sorted = Array.from(pageSet).sort((a, b) => a - b);

    const output: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const page = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && prev && page - prev > 1) {
        output.push("ellipsis");
      }
      output.push(page);
    }
    return output;
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const query = params.toString();
    router.push(query ? `${PUBLIC_ROUTES.PRODUCTS}?${query}` : PUBLIC_ROUTES.PRODUCTS);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-1">
      <Button
        variant="outline"
        size="icon"
        data-testid="pagination-first"
        className="h-8 w-8"
        disabled={currentPage <= 1}
        onClick={() => goToPage(1)}
      >
        <span className="sr-only">Go to first page</span>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        data-testid="pagination-prev"
        className="h-8 w-8"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        <span className="sr-only">Go to previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            data-testid={`pagination-page-${page}`}
            className="h-8 w-8 font-bold"
            onClick={() => goToPage(page)}
          >
            {page}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        data-testid="pagination-next"
        className="h-8 w-8"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        <span className="sr-only">Go to next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        data-testid="pagination-last"
        className="h-8 w-8"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(totalPages)}
      >
        <span className="sr-only">Go to last page</span>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ProductPagination(props: ProductPaginationProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductPaginationInner {...props} />
    </Suspense>
  );
}
