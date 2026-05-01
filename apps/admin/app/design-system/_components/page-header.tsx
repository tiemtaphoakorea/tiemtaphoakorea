import { Badge } from "@workspace/ui/components/badge";

export function PageHeader() {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/90 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Design System</h1>
          <p className="text-xs text-muted-foreground">Token-level reference · K-SMART Platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            React 19
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Tailwind v4
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Radix UI
          </Badge>
        </div>
      </div>
    </div>
  );
}
