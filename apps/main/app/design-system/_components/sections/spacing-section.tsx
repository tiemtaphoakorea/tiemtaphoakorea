import { spacingTokens } from "../../_data/spacing-tokens";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { TokenPill } from "../token-pill";

export function SpacingSection() {
  return (
    <>
      <SectionHeader
        num="03"
        id="spacing"
        title="Spacing"
        desc="4px base grid. Standard Tailwind scale — no custom spacing values."
      />

      <ShowcaseBox title="spacing-scale">
        <div className="space-y-2">
          {spacingTokens.map((s) => (
            <div key={s.class} className="flex items-center gap-3">
              <div className="w-16 shrink-0">
                <TokenPill value={s.class} />
              </div>
              <div className="w-12 shrink-0 font-mono text-xs text-muted-foreground/70">
                {s.value}
              </div>
              <div className="h-4 rounded-sm bg-primary" style={{ width: s.value }} />
              <span className="text-xs text-muted-foreground/70">{s.desc}</span>
            </div>
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
