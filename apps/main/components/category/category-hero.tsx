import { Card, CardContent } from "@workspace/ui/components/card";

type HeroTheme = "beauty" | "food";

interface CategoryHeroProps {
  name: string;
  total: number;
  newCount?: number;
  isCategorized: boolean;
  eyebrow?: string;
  description?: string;
  theme?: HeroTheme;
}

const THEME_STYLES: Record<
  HeroTheme,
  {
    gradient: string;
    statColor: string;
    eyebrowColor: string;
  }
> = {
  beauty: {
    gradient: "linear-gradient(135deg, var(--info-soft) 0%, var(--warning-soft) 100%)",
    statColor: "text-primary",
    eyebrowColor: "text-primary",
  },
  food: {
    gradient: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 60%, #FFF7ED 100%)",
    statColor: "text-warning",
    eyebrowColor: "text-warning",
  },
};

export function CategoryHero({
  name,
  total,
  newCount = 0,
  isCategorized,
  eyebrow,
  description,
  theme = "beauty",
}: CategoryHeroProps) {
  const styles = THEME_STYLES[theme];
  const defaultEyebrow = isCategorized
    ? "Danh mục · Hàng chính hãng"
    : "Cửa hàng · Hàng chính hãng";

  return (
    <Card
      className="relative overflow-hidden rounded-2xl py-0 ring-primary/10 md:rounded-3xl"
      style={{ background: styles.gradient }}
    >
      <CardContent className="relative z-10 grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:gap-4 md:px-10 md:py-9">
        <div className="min-w-0 space-y-1 md:space-y-2">
          <div
            className={`text-[10px] font-bold uppercase tracking-[0.1em] md:text-[11px] md:tracking-[0.12em] ${styles.eyebrowColor}`}
          >
            {eyebrow || defaultEyebrow}
          </div>
          <h1 className="truncate text-lg font-extrabold tracking-tight text-foreground md:overflow-visible md:text-4xl md:whitespace-normal">
            {name}
          </h1>
          <p className="hidden max-w-xl text-sm leading-relaxed text-muted-foreground md:block">
            {description || "Hàng chính hãng nhập khẩu. Giá tốt · Giao nhanh · Đổi trả 7 ngày."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right md:gap-2">
          <div className="flex flex-col items-end">
            <b className={`text-xl font-extrabold tracking-tight md:text-3xl ${styles.statColor}`}>
              {total}
            </b>
            <small className="text-[10px] font-medium text-muted-foreground md:text-[11px]">
              sản phẩm
            </small>
          </div>
          {newCount > 0 && (
            <div className="flex flex-col items-end">
              <b className="text-xl font-extrabold tracking-tight text-success md:text-3xl">
                +{newCount}
              </b>
              <small className="text-[10px] font-medium text-muted-foreground md:text-[11px]">
                mới tuần này
              </small>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
