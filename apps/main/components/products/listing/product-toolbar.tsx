import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LayoutGrid, List, Search, X } from "lucide-react";

const PAGE_SIZE_OPTIONS = [4, 12, 24, 48];

const SORT_OPTIONS = [
  { value: "latest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "rating", label: "Đánh giá tốt nhất" },
];

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  productsCount: number;
  activeSort: string;
  onSortChange: (sort: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  activeFilters?: FilterTag[];
}

export function ProductToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  productsCount,
  activeSort,
  onSortChange,
  pageSize,
  onPageSizeChange,
  activeFilters = [],
}: ProductToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Search + count + filter tags */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm trong danh mục..."
            className="h-9 w-56 rounded-full border-border bg-muted pl-9 text-sm focus-visible:bg-background"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Hiển thị <b className="font-bold text-foreground">{productsCount}</b> sản phẩm
        </span>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((tag) => (
              <Badge
                key={tag.key}
                variant="secondary"
                className="h-7 gap-1 rounded-full bg-primary/10 px-3 text-[11px] font-semibold text-primary"
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

      {/* Right: View toggle + sort + page size */}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Chế độ hiển thị"
          className="flex items-center rounded-xl border border-primary/30 bg-primary/5 p-0.5"
        >
          <button
            type="button"
            aria-label="Hiển thị dạng lưới"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            className={
              viewMode === "grid"
                ? "size-9 rounded-lg inline-flex items-center justify-center bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                : "size-9 rounded-lg inline-flex items-center justify-center text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            }
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Hiển thị dạng danh sách"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
            className={
              viewMode === "list"
                ? "size-9 rounded-lg inline-flex items-center justify-center bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                : "size-9 rounded-lg inline-flex items-center justify-center text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            }
          >
            <List className="size-4" />
          </button>
        </div>

        <Select value={activeSort} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-9 w-28 rounded-lg border-border bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / trang
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
