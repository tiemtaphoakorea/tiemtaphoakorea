"use client";

import type { OrderProductSelection, OrderProductVariant } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Input } from "@workspace/ui/components/input";
import { Popover, PopoverAnchor, PopoverContent } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { ClipboardPaste, ImageOff, ListChecks, Loader2, Search } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { ProductMultiSelectDialog } from "./product-multi-select-dialog";
import { useVariantSearch } from "./use-products-index";

interface OrderAddRowProps {
  onAddItem: (variant: OrderProductVariant, product: OrderProductSelection) => void;
  // Optional: when present, shows the "Chọn nhiều" button + multi-select dialog.
  onAddBulk?: (
    items: Array<{
      variant: OrderProductVariant;
      product: OrderProductSelection;
      quantity: number;
    }>,
  ) => void;
  // Optional: shows the "Dán SKU" button next to the bulk picker.
  onOpenPasteDialog?: () => void;
}

const LOW_STOCK_THRESHOLD = 5;

// Sapo-style picker: search input + "Chọn nhiều" button. Dropdown shows
// rich rows (thumbnail, product, variant, SKU, stock, sellable, price).
export function OrderAddRow({ onAddItem, onAddBulk, onOpenPasteDialog }: OrderAddRowProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 250);
  const [multiOpen, setMultiOpen] = React.useState(false);
  const { rows, isLoading } = useVariantSearch(debouncedSearch);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (variant: OrderProductVariant, product: OrderProductSelection) => {
    onAddItem(variant, product);
    setSearch("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Popover open={open && !multiOpen} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Tìm theo tên, mã SKU... (F3)"
                className="h-11 pl-9"
                aria-label="Tìm sản phẩm"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false} loop>
              <CommandList className="max-h-96">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm sản phẩm...
                  </div>
                )}
                {!isLoading && rows.length === 0 && (
                  <CommandEmpty>Không có sản phẩm còn hàng phù hợp.</CommandEmpty>
                )}
                {!isLoading && rows.length > 0 && (
                  <CommandGroup>
                    {rows.map(({ variant, product }) => (
                      <ProductRow
                        key={variant.id}
                        variant={variant}
                        product={product}
                        onSelect={() => handleSelect(variant, product)}
                      />
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {onAddBulk && (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-2"
            onClick={() => {
              setOpen(false);
              setMultiOpen(true);
            }}
          >
            <ListChecks className="h-4 w-4" />
            Chọn nhiều
          </Button>
        )}
        {onOpenPasteDialog && (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-2"
            onClick={onOpenPasteDialog}
          >
            <ClipboardPaste className="h-4 w-4" />
            Dán SKU
          </Button>
        )}
      </div>
      {onAddBulk && (
        <ProductMultiSelectDialog
          open={multiOpen}
          onOpenChange={setMultiOpen}
          onConfirm={onAddBulk}
        />
      )}
    </>
  );
}

interface ProductRowProps {
  variant: OrderProductVariant;
  product: OrderProductSelection;
  onSelect: () => void;
}

function ProductRow({ variant, product, onSelect }: ProductRowProps) {
  const onHand = variant.onHand;
  const available = Math.max(0, variant.onHand - variant.reserved);
  const lowStock = available <= LOW_STOCK_THRESHOLD;
  const thumbnail = variant.images?.[0]?.imageUrl || product.thumbnail || null;

  return (
    <CommandItem
      value={`${product.id}::${variant.id}::${variant.sku}`}
      onSelect={onSelect}
      className="flex items-center gap-3 py-2"
    >
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
          Tồn: <span className="font-medium text-foreground tabular-nums">{onHand}</span>
          {" | "}
          Có thể bán:{" "}
          <span
            className={cn("font-medium tabular-nums", lowStock ? "text-amber-600" : "text-primary")}
          >
            {available}
          </span>
        </div>
      </div>
    </CommandItem>
  );
}
