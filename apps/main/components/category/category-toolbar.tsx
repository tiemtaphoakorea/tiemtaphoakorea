"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Filter, LayoutGrid, List, X } from "lucide-react";
import { useFilter } from "./category-filter-context";

const SORT_OPTIONS = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "latest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
];

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

interface CategoryToolbarProps {
  productsCount: number;
  activeSort: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  activeFilters?: FilterTag[];
}

export function CategoryToolbar({
  productsCount,
  activeSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFilters = [],
}: CategoryToolbarProps) {
  const { setIsOpen } = useFilter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 rounded-full lg:hidden"
        >
          <Filter className="size-3.5" /> Bộ lọc
        </Button>
        <span className="text-sm text-muted-foreground">
          Hiển thị <b className="font-bold text-foreground">{productsCount}</b> sản phẩm
        </span>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((tag) => (
              <Badge
                key={tag.key}
                variant="secondary"
                className="h-7 gap-1 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
              >
                <span>{tag.label}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={tag.onRemove}
                  aria-label={`Xóa ${tag.label}`}
                  className="-mr-1.5 size-4 rounded-full text-primary hover:bg-primary/15 hover:text-primary"
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={activeSort} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-background text-sm">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div
          role="group"
          aria-label="Chế độ hiển thị"
          className="flex items-center rounded-xl border border-primary/30 bg-primary/5 p-0.5"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Hiển thị dạng lưới"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            className={
              viewMode === "grid"
                ? "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
            }
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Hiển thị dạng danh sách"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
            className={
              viewMode === "list"
                ? "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
            }
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
