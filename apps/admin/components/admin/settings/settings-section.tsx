import type { ReactNode } from "react";

/** Field — label + input/textarea/component. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Two-column field row. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}
