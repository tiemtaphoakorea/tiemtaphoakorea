import { cn } from "@workspace/ui/lib/utils";
import type { StatusColor } from "../_data/status-colors";

interface StatusPillProps {
  status: StatusColor;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md" }: StatusPillProps) {
  const sizeClass = size === "sm" ? "px-2.5 py-0.5 gap-1" : "px-3 py-1 gap-1.5";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border text-xs font-medium",
        sizeClass,
        status.classes,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  );
}
