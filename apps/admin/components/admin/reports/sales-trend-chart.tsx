"use client";

/**
 * SalesTrendChart — line/area chart for time-series sales/payment data.
 * Used by: sales/by-time and sales/payments-by-time pages.
 */

import { formatCurrency } from "@workspace/shared/utils";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type TrendDataPoint = {
  period: string;
  [key: string]: string | number;
};

export type TrendSeries = {
  key: string;
  label: string;
  color: string;
};

interface SalesTrendChartProps {
  data: TrendDataPoint[];
  series: TrendSeries[];
  height?: number;
}

export function SalesTrendChart({ data, series, height = 260 }: SalesTrendChartProps) {
  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Không có dữ liệu trong kỳ này
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} style={{ height }}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.03} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: unknown) =>
                typeof value === "number" ? formatCurrency(value) : String(value)
              }
            />
          }
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
