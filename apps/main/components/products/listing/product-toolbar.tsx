import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LayoutGrid, List, Search } from "lucide-react";

const PAGE_SIZE_OPTIONS = [4, 12, 24, 48];

const SORT_OPTIONS = [
  { value: "latest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá tốt nhất" },
];

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
}: ProductToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {/* Left: Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm trong danh mục..."
            className="h-9 w-52 rounded-full border-border bg-muted pl-9 text-sm focus:bg-background"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{productsCount}</span> sản phẩm
        </span>
      </div>

      {/* Right: View toggle + sort + page size */}
      <div className="flex items-center gap-2">
        {/* Segmented view toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            aria-label="Hiển thị dạng lưới"
            onClick={() => onViewModeChange("grid")}
            className={`rounded-md p-1.5 transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Hiển thị dạng danh sách"
            onClick={() => onViewModeChange("list")}
            className={`rounded-md p-1.5 transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Sort Select */}
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

        {/* Page size Select */}
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
