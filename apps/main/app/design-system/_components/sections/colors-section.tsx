import { chartColors } from "../../_data/chart-colors";
import { colorTokens } from "../../_data/color-tokens";
import { statusColors } from "../../_data/status-colors";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { StatusPill } from "../status-pill";
import { TokenPill } from "../token-pill";

export function ColorsSection() {
  return (
    <>
      <SectionHeader
        num="01"
        id="colors"
        title="Color Tokens"
        desc="Semantic CSS custom properties — use token names, never raw hex in components."
        topMargin={false}
      />

      <div className="mb-8 space-y-6">
        {colorTokens.map((group) => (
          <div key={group.group}>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.group}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {group.tokens.map((t) => (
                <div
                  key={t.name}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <div
                    className="h-14 w-full border-b border-border"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <div className="p-3">
                    <p className="font-mono text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                    <div className="mt-2">
                      <TokenPill value={t.value} />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                      {t.tailwind}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ShowcaseBox title="status-tokens — semantic, theme-aware" className="mb-8">
        <div className="flex flex-wrap gap-2">
          {statusColors.map((s) => (
            <StatusPill key={s.label} status={s} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {statusColors.map((s) => (
            <code
              key={s.token}
              className="rounded bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground"
            >
              {s.classes}
            </code>
          ))}
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="chart-colors — --chart-1 through --chart-5">
        <div className="flex gap-3">
          {chartColors.map((c) => (
            <div key={c.token} className="flex flex-col items-center gap-1.5">
              <div
                className="size-10 rounded-lg border border-border shadow-sm"
                style={{ backgroundColor: c.swatch }}
              />
              <p className="font-mono text-[10px] text-muted-foreground">{c.token}</p>
              <p className="text-[10px] text-muted-foreground/70">{c.name}</p>
            </div>
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
