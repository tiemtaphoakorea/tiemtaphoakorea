"use client";

import type { OrderProductSelection, OrderProductVariant } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { ImageOff, Loader2, Search } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { useVariantSearch } from "./use-products-index";

interface ProductMultiSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    items: Array<{
      variant: OrderProductVariant;
      product: OrderProductSelection;
      quantity: number;
    }>,
  ) => void;
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductMultiSelectDialog({
  open,
  onOpenChange,
  onConfirm,
}: ProductMultiSelectDialogProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 250);
  const { rows, isLoading } = useVariantSearch(debouncedSearch);
  const [selected, setSelected] = React.useState<Map<string, { qty: number }>>(new Map());

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Map());
    }
  }, [open]);

  const toggleVariant = (variantId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.set(variantId, { qty: 1 });
      return next;
    });
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.variant.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        for (const r of rows) next.delete(r.variant.id);
      } else {
        for (const r of rows) {
          if (!next.has(r.variant.id)) next.set(r.variant.id, { qty: 1 });
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const lookup = new Map(rows.map((r) => [r.variant.id, r]));
    const items: Array<{
      variant: OrderProductVariant;
      product: OrderProductSelection;
      quantity: number;
    }> = [];
    for (const [variantId, { qty }] of selected) {
      const row = lookup.get(variantId);
      if (row) items.push({ variant: row.variant, product: row.product, quantity: qty });
    }
    if (items.length > 0) onConfirm(items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn nhanh sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã SKU..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-y py-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={rows.length === 0}
            />
            Chọn tất cả{rows.length > 0 ? ` (${rows.length})` : ""}
          </label>
          {selected.size > 0 && (
            <span className="text-xs text-muted-foreground">
              Đã chọn <span className="font-medium text-foreground">{selected.size}</span> sản phẩm
            </span>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không có sản phẩm còn hàng phù hợp.
            </div>
          )}
          {!isLoading && rows.length > 0 && (
            <ul className="divide-y">
              {rows.map(({ variant, product }) => {
                const isSelected = selected.has(variant.id);
                const available = Math.max(0, variant.onHand - variant.reserved);
                const lowStock = available <= LOW_STOCK_THRESHOLD;
                const thumbnail = variant.images?.[0]?.imageUrl || product.thumbnail || null;
                return (
                  <li key={variant.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-2 py-2.5 hover:bg-muted/50",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleVariant(variant.id)}
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover"
                            unoptimized
                          />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{product.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          <span className="font-mono">{variant.sku}</span>
                          {variant.name && <span className="text-primary"> · {variant.name}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <div className="text-muted-foreground">
                          Giá:{" "}
                          <span className="font-medium text-foreground tabular-nums">
                            {formatCurrency(Number(variant.price))}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Tồn:{" "}
                          <span className="font-medium text-foreground tabular-nums">
                            {variant.onHand}
                          </span>
                          {" | "}
                          Có thể bán:{" "}
                          <span
                            className={cn(
                              "font-medium tabular-nums",
                              lowStock ? "text-amber-600" : "text-primary",
                            )}
                          >
                            {available}
                          </span>
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Thoát
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
            Xác nhận{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
