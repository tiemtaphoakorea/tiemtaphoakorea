/** Mini bar chart for dashboard cards. Matches the design's `.chart-area` block. */

export type BarPoint = { l: string; v: number };

type BarChartMiniProps = {
  data: BarPoint[];
  /** Tailwind color class for the highlighted (last) bar. */
  highlightClass?: string;
  /** Tailwind color class for non-highlight bars (typically a soft tint). */
  baseClass?: string;
};

export function BarChartMini({
  data,
  highlightClass = "bg-primary",
  baseClass = "bg-primary/30",
}: BarChartMiniProps) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="flex h-37.5 items-end gap-1.5 px-5 pb-3 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div
            className={`w-full rounded-t-[5px] transition-[height] duration-300 ${i === data.length - 1 ? highlightClass : baseClass}`}
            style={{ height: `${(d.v / max) * 100}%` }}
          />
          <div className="text-xs font-medium text-muted-foreground/70">{d.l}</div>
        </div>
      ))}
    </div>
  );
}
