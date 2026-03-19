import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { ArrowUpDown, ChevronDown, LayoutGrid, List, Search } from "lucide-react";

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  productsCount: number;
  activeSort: string;
  onSortChange: (sort: string) => void;
}

export function ProductToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  productsCount,
  activeSort,
  onSortChange,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:flex-row dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex w-full items-center gap-4 sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm kiếm trong danh mục..."
            className="h-10 rounded-xl border-none bg-white pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="hidden items-center gap-1 rounded-xl border border-gray-100 bg-white p-1 sm:flex">
          <button
            type="button"
            aria-label="Hiển thị dạng lưới"
            onClick={() => onViewModeChange("grid")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-gray-50"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Hiển thị dạng danh sách"
            onClick={() => onViewModeChange("list")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-gray-50"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
        <span className="text-muted-foreground text-sm font-bold">
          <span className="text-primary">{productsCount}</span> sản phẩm
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-gray-100 bg-white font-bold shadow-sm"
            >
              <ArrowUpDown className="h-4 w-4" />
              {activeSort === "price-asc"
                ? "Giá thấp đến cao"
                : activeSort === "price-desc"
                  ? "Giá cao đến thấp"
                  : activeSort === "rating"
                    ? "Đánh giá tốt nhất"
                    : "Mới nhất"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
            <DropdownMenuItem
              onClick={() => onSortChange("latest")}
              className="rounded-lg font-medium"
            >
              Mới nhất
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange("price-asc")}
              className="rounded-lg font-medium"
            >
              Giá thấp đến cao
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange("price-desc")}
              className="rounded-lg font-medium"
            >
              Giá cao đến thấp
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange("rating")}
              className="rounded-lg font-medium"
            >
              Đánh giá tốt nhất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
