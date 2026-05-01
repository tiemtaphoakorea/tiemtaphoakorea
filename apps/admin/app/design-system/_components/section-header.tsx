import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

interface SectionHeaderProps {
  num: string;
  id: string;
  title: string;
  desc: string;
  topMargin?: boolean;
}

export function SectionHeader({ num, id, title, desc, topMargin = true }: SectionHeaderProps) {
  return (
    <div id={id} className={cn("mb-6 scroll-mt-20", topMargin && "mt-16")}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-medium text-muted-foreground/70">{num}</span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      <p className="mt-1 ml-9 text-sm text-muted-foreground">{desc}</p>
      <Separator className="mt-4" />
    </div>
  );
}
