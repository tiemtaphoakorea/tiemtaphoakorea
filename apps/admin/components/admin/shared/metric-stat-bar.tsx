import type { ReactNode } from "react";

export interface MetricStatItem {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconClassName: string;
  trend?: {
    text: string;
    className: string;
    icon?: ReactNode;
  };
}

interface MetricStatBarProps {
  items: MetricStatItem[];
}

const gridColClass: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function MetricStatBar({ items }: MetricStatBarProps) {
  const colClass = gridColClass[items.length] ?? "grid-cols-2 lg:grid-cols-4";

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className={`grid gap-px bg-border ${colClass}`}>
        {items.map((item, i) => (
          <div key={i} className="bg-card px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                {item.label}
              </p>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.iconClassName}`}
              >
                {item.icon}
              </div>
            </div>
            <p className="mt-3 truncate text-2xl font-black tabular-nums tracking-tight md:text-3xl">
              {item.value}
            </p>
            {item.trend && (
              <div className={`mt-2 flex items-center gap-1 ${item.trend.className}`}>
                {item.trend.icon}
                <span className="text-[10px] font-bold tracking-tight uppercase">
                  {item.trend.text}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
