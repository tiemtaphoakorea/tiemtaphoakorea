"use client";

import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Search } from "lucide-react";

export type CartSortMode = "added" | "name" | "sku" | "qty" | "total";

const SORT_LABELS: Record<CartSortMode, string> = {
  added: "Thứ tự thêm",
  name: "Tên A → Z",
  sku: "SKU A → Z",
  qty: "Số lượng ↓",
  total: "Thành tiền ↓",
};

interface OrderCartToolbarProps {
  cartSearch: string;
  onCartSearchChange: (value: string) => void;
  sortMode: CartSortMode;
  onSortModeChange: (value: CartSortMode) => void;
  groupByProduct: boolean;
  onGroupByProductChange: (value: boolean) => void;
  itemCount: number;
}

// Filter/sort/group controls for the cart. Only meaningful when items exist;
// the parent should not render this when itemCount === 0.
export function OrderCartToolbar({
  cartSearch,
  onCartSearchChange,
  sortMode,
  onSortModeChange,
  groupByProduct,
  onGroupByProductChange,
  itemCount,
}: OrderCartToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={cartSearch}
          onChange={(e) => onCartSearchChange(e.target.value)}
          placeholder={`Tìm trong ${itemCount} dòng đã thêm...`}
          className="h-9 pl-9"
          aria-label="Tìm trong giỏ"
        />
      </div>
      <Select value={sortMode} onValueChange={(v) => onSortModeChange(v as CartSortMode)}>
        <SelectTrigger size="sm" className="w-full sm:w-44" aria-label="Sắp xếp">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as CartSortMode[]).map((mode) => (
            <SelectItem key={mode} value={mode}>
              {SORT_LABELS[mode]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
        <Switch
          id="group-by-product"
          checked={groupByProduct}
          onCheckedChange={onGroupByProductChange}
        />
        <span className="select-none">Gộp theo SP</span>
      </label>
    </div>
  );
}
