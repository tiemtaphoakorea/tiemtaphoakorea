import { radiusTokens } from "../../_data/radius-tokens";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { TokenPill } from "../token-pill";

export function RadiusSection() {
  return (
    <>
      <SectionHeader
        num="04"
        id="radius"
        title="Border Radius"
        desc="Base: --radius: 0.5rem (8px). Scale via calc() from the base token."
      />

      <ShowcaseBox title="radius-scale">
        <div className="flex flex-wrap items-end gap-4">
          {radiusTokens.map((r) => (
            <div key={r.tailwind} className="flex flex-col items-center gap-2">
              <div className={`size-14 border-2 border-primary bg-primary/10 ${r.tailwind}`} />
              <TokenPill value={r.tailwind} />
              <p className="font-mono text-xs text-muted-foreground/70">{r.computed}</p>
              <p className="max-w-20 text-center text-xs text-muted-foreground/70">
                {r.usage}
              </p>
            </div>
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
