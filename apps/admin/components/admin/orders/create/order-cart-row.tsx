"use client";

import type { OrderBuilderItem } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { NumberInput } from "@workspace/ui/components/number-input";
import { TableCell, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";

interface OrderCartRowProps {
  index: number;
  item: OrderBuilderItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onUpdatePrice: (variantId: string, price: number) => void;
  onRemoveItem: (variantId: string) => void;
}

// Compact ~44px row for desktop spreadsheet view.
export function OrderCartRow({
  index,
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: OrderCartRowProps) {
  const effectivePrice = item.customPrice ?? item.price;
  const lineTotal = effectivePrice * item.quantity;
  const shortage = item.quantity > item.available;

  return (
    <TableRow className="group">
      <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
        {index + 1}
      </TableCell>
      <TableCell className="min-w-0">
        <div className="flex flex-col">
          <span className="truncate font-medium" title={item.productName}>
            {item.productName}
          </span>
          <span
            className="truncate text-xs text-muted-foreground"
            title={`${item.variantName} · ${item.sku}`}
          >
            {item.variantName || "Mặc định"} · {item.sku}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <NumberInput
          aria-label="Đơn giá"
          className="h-8 w-28 text-right ml-auto"
          decimalScale={0}
          value={effectivePrice}
          onValueChange={({ floatValue }) => {
            if (floatValue !== undefined) onUpdatePrice(item.variantId, floatValue);
          }}
        />
      </TableCell>
      <TableCell
        className={cn(
          "text-center text-sm tabular-nums",
          shortage ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {Math.max(0, item.available)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Giảm số lượng"
            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <NumberInput
            aria-label="Số lượng"
            className="h-8 w-14 text-center"
            decimalScale={0}
            min={1}
            value={item.quantity}
            onValueChange={({ floatValue }) => {
              if (floatValue !== undefined && floatValue > 0) {
                onUpdateQuantity(item.variantId, floatValue);
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Tăng số lượng"
            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {shortage && (
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Thiếu {item.quantity - Math.max(0, item.available)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(lineTotal)}
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
          aria-label="Xoá khỏi đơn"
          onClick={() => onRemoveItem(item.variantId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
