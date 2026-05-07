"use client";

import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Loader2, Save } from "lucide-react";

interface OrderSummaryBarProps {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

// Sticky bottom bar — always visible. Shows live totals + primary CTA.
export function OrderSummaryBar({
  itemCount,
  totalQuantity,
  subtotal,
  shippingFee,
  total,
  canSubmit,
  isSubmitting,
  onSubmit,
}: OrderSummaryBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{itemCount}</span> dòng ·{" "}
            <span className="font-medium text-foreground tabular-nums">{totalQuantity}</span> sản
            phẩm
          </div>
          <div className="text-muted-foreground">
            Tạm tính:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>
          {shippingFee > 0 && (
            <div className="text-muted-foreground">
              Phí ship:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(shippingFee)}
              </span>
            </div>
          )}
          <div className="text-base font-semibold">
            Tổng: <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="w-full gap-2 sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Tạo đơn hàng
        </Button>
      </div>
    </div>
  );
}
