"use client";

import { FieldLabel } from "@workspace/ui/components/field";
import { cn } from "@workspace/ui/lib/utils";
import { Check } from "lucide-react";

export type ColorPair = { brand: string; accent: string; label: string };

export const COLOR_PAIRS: ColorPair[] = [
  { label: "Indigo & Vàng", brand: "#6366F1", accent: "#F59E0B" },
  { label: "Tím & Hồng", brand: "#8B5CF6", accent: "#EC4899" },
  { label: "Xanh & Cam", brand: "#3B82F6", accent: "#F97316" },
  { label: "Mòng két & Vàng", brand: "#14B8A6", accent: "#EAB308" },
  { label: "Đỏ & Vàng", brand: "#EF4444", accent: "#FACC15" },
  { label: "Xanh lá & Xanh", brand: "#22C55E", accent: "#3B82F6" },
  { label: "Hồng & Tím", brand: "#F43F5E", accent: "#8B5CF6" },
  { label: "Bầu trời & Ngọc", brand: "#0EA5E9", accent: "#10B981" },
  { label: "Violet & Hổ phách", brand: "#7C3AED", accent: "#F59E0B" },
  { label: "Đá & Mòng két", brand: "#475569", accent: "#14B8A6" },
];

function isPairActive(brand: string, accent: string, pair: ColorPair) {
  return (
    brand.toLowerCase() === pair.brand.toLowerCase() &&
    accent.toLowerCase() === pair.accent.toLowerCase()
  );
}

interface ColorPairPickerProps {
  brandColor: string;
  accentColor: string;
  onBrandChange: (v: string) => void;
  onAccentChange: (v: string) => void;
}

export function ColorPairPicker({
  brandColor,
  accentColor,
  onBrandChange,
  onAccentChange,
}: ColorPairPickerProps) {
  return (
    <>
      <FieldLabel>Màu sắc thương hiệu</FieldLabel>
      <div className="grid grid-cols-5 gap-1.5">
        {COLOR_PAIRS.map((pair) => {
          const active = isPairActive(brandColor, accentColor, pair);
          return (
            <button
              key={pair.label}
              type="button"
              title={pair.label}
              onClick={() => {
                onBrandChange(pair.brand);
                onAccentChange(pair.accent);
              }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-md border-2 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-foreground" : "border-transparent",
              )}
            >
              <span className="block h-5 w-full" style={{ backgroundColor: pair.brand }} />
              <span className="block h-2.5 w-full" style={{ backgroundColor: pair.accent }} />
              {active && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
