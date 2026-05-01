import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

interface ShowcaseBoxProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ShowcaseBox({ title, children, className }: ShowcaseBoxProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
