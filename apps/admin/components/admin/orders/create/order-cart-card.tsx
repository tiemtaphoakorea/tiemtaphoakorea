"use client";

import type { OrderBuilderItem } from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { NumberInput } from "@workspace/ui/components/number-input";
import { cn } from "@workspace/ui/lib/utils";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";

interface OrderCartCardProps {
  index: number;
  item: OrderBuilderItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onUpdatePrice: (variantId: string, price: number) => void;
  onRemoveItem: (variantId: string) => void;
}

// Mobile compact card — 2 rows: identity + actions/total.
export function OrderCartCard({
  index,
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: OrderCartCardProps) {
  const effectivePrice = item.customPrice ?? item.price;
  const lineTotal = effectivePrice * item.quantity;
  const shortage = item.quantity > item.available;

  return (
    <div className="flex flex-col gap-2 border-b px-3 py-2.5 last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
          {index + 1}.
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" title={item.productName}>
            {item.productName}
          </div>
          <div
            className="truncate text-xs text-muted-foreground"
            title={`${item.variantName} · ${item.sku}`}
          >
            {item.variantName || "Mặc định"} · {item.sku} · Tồn{" "}
            <span className={shortage ? "text-amber-600" : ""}>{Math.max(0, item.available)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
          aria-label="Xoá khỏi đơn"
          onClick={() => onRemoveItem(item.variantId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <NumberInput
          aria-label="Đơn giá"
          className="h-8 w-24 text-right"
          decimalScale={0}
          value={effectivePrice}
          onValueChange={({ floatValue }) => {
            if (floatValue !== undefined) onUpdatePrice(item.variantId, floatValue);
          }}
        />
        <div className="flex items-center gap-1">
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
            className="h-8 w-12 text-center"
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
        <div
          className={cn("ml-auto text-sm font-medium tabular-nums", shortage && "text-amber-600")}
        >
          {formatCurrency(lineTotal)}
        </div>
      </div>
      {shortage && (
        <div className="flex items-center gap-1 pl-7 text-[11px] text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Thiếu {item.quantity - Math.max(0, item.available)} so với tồn kho
        </div>
      )}
    </div>
  );
}
