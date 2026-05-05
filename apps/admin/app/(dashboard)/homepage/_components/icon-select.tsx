"use client";

import { GENERATED_ICONS } from "@workspace/shared/generated-icons";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

const ICON_KEYS = Object.keys(GENERATED_ICONS) as Array<keyof typeof GENERATED_ICONS>;

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
};

export function IconSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Null / no icon option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "h-10 w-10 rounded-lg border-2 text-xs",
          value === null ? "border-primary bg-primary/10" : "border-border",
        )}
        title="Không có icon"
        aria-label="Không có icon"
      >
        ∅
      </button>

      {ICON_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "h-10 w-10 rounded-lg border-2 p-1",
            value === key ? "border-primary bg-primary/10" : "border-border",
          )}
          title={key}
          aria-label={key}
        >
          <Image
            src={GENERATED_ICONS[key]}
            alt={key}
            width={32}
            height={32}
            className="h-full w-full object-contain"
          />
        </button>
      ))}
    </div>
  );
}
