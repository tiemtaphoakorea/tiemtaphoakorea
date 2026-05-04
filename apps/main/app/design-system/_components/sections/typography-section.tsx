import { fontWeights, typeScale } from "../../_data/type-scale";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { TokenPill } from "../token-pill";

export function TypographySection() {
  return (
    <>
      <SectionHeader
        num="02"
        id="typography"
        title="Typography"
        desc="Manrope (--font-sans) and Syne (--font-display) loaded via next/font/google. Tailwind default type scale."
      />

      <ShowcaseBox title="type-scale" className="mb-6">
        <div className="space-y-4">
          {typeScale.map((t) => (
            <div key={t.class} className="flex items-baseline gap-4">
              <div className="w-20 shrink-0">
                <TokenPill value={t.class} />
              </div>
              <div className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
                {t.size}
              </div>
              <p
                className={`${t.class} leading-none text-foreground`}
                style={{ fontWeight: t.weight }}
              >
                The quick brown fox
              </p>
              <p className="ml-auto hidden text-xs text-muted-foreground sm:block">{t.usage}</p>
            </div>
          ))}
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="font-weights">
        <div className="flex flex-wrap gap-8">
          {fontWeights.map(([cls, w, name]) => (
            <div key={cls}>
              <p className={`text-2xl text-foreground ${cls}`}>Ag</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{cls}</p>
              <p className="font-mono text-xs text-muted-foreground/70">
                {w} · {name}
              </p>
            </div>
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
