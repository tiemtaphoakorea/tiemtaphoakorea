"use client";

/** Pill filter tabs used in list pages. Matches `.filter-tabs` block. */

export type FilterTab = { id: string; label: string };

type FilterTabsProps<T extends string> = {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
};

export function FilterTabs<T extends string>({ tabs, value, onChange }: FilterTabsProps<T>) {
  return (
    <div className="flex gap-px rounded-lg bg-border p-0.5">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`whitespace-nowrap rounded-md px-3 py-[5px] text-xs transition-colors ${
              active
                ? "bg-white font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
