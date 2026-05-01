import { Badge } from "@workspace/ui/components/badge";

export function PageFooter() {
  return (
    <div className="mt-12 border-t border-border pt-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">K-SMART Design System</p>
          <p className="text-xs text-muted-foreground">
            Tailwind CSS v4 · Radix UI · React 19 · CVA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            packages/ui
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            DESIGN.md
          </Badge>
        </div>
      </div>
    </div>
  );
}
