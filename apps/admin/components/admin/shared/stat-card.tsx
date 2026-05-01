import { Card } from "@workspace/ui/components/card";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

export type StatCardTone = "primary" | "amber" | "danger" | "mint" | "info";

const toneClasses: Record<StatCardTone, { bg: string; ic: string }> = {
  primary: { bg: "bg-primary/10", ic: "text-primary" },
  amber: { bg: "bg-amber-100", ic: "text-amber-700" },
  danger: { bg: "bg-red-100", ic: "text-red-600" },
  mint: { bg: "bg-emerald-100", ic: "text-emerald-700" },
  info: { bg: "bg-blue-100", ic: "text-blue-600" },
};

export type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  direction?: "up" | "down";
  icon: LucideIcon;
  tone?: StatCardTone;
};

/** Stat card matching the Tiệm Korea CMS "stat-card" block. */
export function StatCard({
  label,
  value,
  delta,
  direction = "up",
  icon: Icon,
  tone = "primary",
}: StatCardProps) {
  const t = toneClasses[tone];
  const deltaClass = direction === "up" ? "text-emerald-700" : "text-red-600";
  const ArrowIcon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <Card className="flex flex-col gap-2.5 border border-border p-4 px-[18px] py-4 shadow-none max-sm:rounded-none max-sm:border-0 max-sm:border-r max-sm:border-b max-sm:border-border max-sm:shadow-none max-sm:ring-0">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={`grid h-[34px] w-[34px] place-items-center rounded-[9px] ${t.bg}`}>
          <Icon className={`h-[17px] w-[17px] ${t.ic}`} strokeWidth={2} />
        </div>
      </div>
      <div className="text-[24px] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      {delta && (
        <div className={`flex items-center gap-1 text-xs font-medium ${deltaClass}`}>
          <ArrowIcon className="h-3 w-3" strokeWidth={2.5} />
          {delta}
        </div>
      )}
    </Card>
  );
}
