"use client";

import { Button } from "@workspace/ui/components/button";

import { cn } from "@workspace/ui/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    if (i > 0 && p - sorted[i - 1]! > 1) {
      out.push("ellipsis");
    }
    out.push(p);
  }
  return out;
}

export type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const safeTotal = Math.max(1, totalPages);
  const page = Math.min(Math.max(1, currentPage), safeTotal);
  const items = buildPageList(page, safeTotal);

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-10 rounded-2xl text-primary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="flex h-10 min-w-10 items-center justify-center px-1 text-base font-medium tracking-widest text-primary/60"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "outline"}
            size="icon-sm"
            className="h-10 min-w-10 rounded-2xl px-2.5 text-sm font-semibold tabular-nums"
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-10 rounded-2xl text-primary"
        disabled={page >= safeTotal}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  );
}

export { PaginationControls };
