"use client";

import type { ProductVariant } from "@workspace/shared/types/product";

interface ProductVariantChipsProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (id: string) => void;
}

export function ProductVariantChips({
  variants,
  selectedVariantId,
  onSelect,
}: ProductVariantChipsProps) {
  if (variants.length <= 1) return null;
  const selected = variants.find((v) => v.id === selectedVariantId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Phân loại</span>
        {selected && (
          <span className="text-xs font-medium normal-case tracking-normal text-foreground">
            Đang chọn: {selected.name}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariantId === v.id;
          const isOut = (v.onHand ?? 0) <= 0;
          return (
            <button
              key={v.id}
              type="button"
              disabled={isOut}
              onClick={() => onSelect(v.id)}
              className={`flex h-10 items-center gap-1.5 rounded-xl border-2 px-4 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 font-bold text-primary"
                  : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
              } ${isOut ? "cursor-not-allowed opacity-45 line-through" : ""}`}
            >
              {v.name}
              {isOut && <span className="text-xs font-normal">(hết)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
