import { Sparkles } from "lucide-react";
import { tokenQuickReference } from "../../_data/quick-reference";

export function QuickReferenceSection() {
  return (
    <div className="mt-16">
      <div className="rounded-2xl border border-border bg-primary p-8 text-primary-foreground">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Token Quick Reference</h2>
            <p className="text-sm text-primary-foreground/60">
              Copy-paste ready — all semantic tokens in one place
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {tokenQuickReference.map(([label, token]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 rounded-lg bg-primary-foreground/5 px-3 py-2"
            >
              <span className="text-xs text-primary-foreground/60">{label}</span>
              <code className="rounded bg-primary-foreground/10 px-1.5 py-0.5 font-mono text-xs">
                {token}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
