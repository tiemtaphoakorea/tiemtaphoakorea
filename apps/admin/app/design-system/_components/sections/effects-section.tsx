import { shadowTokens } from "../../_data/spacing-tokens";
import { SectionHeader } from "../section-header";
import { TokenPill } from "../token-pill";

const glassSurfaces = [
  { className: "glass", token: ".glass", desc: "Frosted glass surface" },
  { className: "glass-card", token: ".glass-card", desc: "Card with transition" },
  { className: "glass-header", token: ".glass-header", desc: "Sticky nav surface" },
] as const;

export function EffectsSection() {
  return (
    <>
      <SectionHeader
        num="05"
        id="effects"
        title="Shadows & Effects"
        desc="Elevation via shadows. Glass utilities for nav and card surfaces."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {shadowTokens.map((s) => (
          <div
            key={s.name}
            className={`flex h-20 items-center justify-center rounded-xl border border-border bg-card ${s.name}`}
          >
            <div className="text-center">
              <TokenPill value={s.name} />
              <p className="mt-1 text-xs text-muted-foreground/70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {glassSurfaces.map((g) => (
          <div
            key={g.token}
            className={`${g.className} flex h-20 items-center justify-center rounded-xl`}
          >
            <div className="text-center">
              <TokenPill value={g.token} />
              <p className="mt-1 text-xs text-muted-foreground">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
