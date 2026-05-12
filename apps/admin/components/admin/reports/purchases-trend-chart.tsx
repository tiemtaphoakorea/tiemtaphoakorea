"use client";

import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PurchasesByTimePeriodRow } from "@/services/reports-purchases.client";

interface PurchasesTrendChartProps {
  rows: PurchasesByTimePeriodRow[];
  loading?: boolean;
}

function shortVnd(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function PurchasesTrendChart({ rows, loading }: PurchasesTrendChartProps) {
  if (loading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black">Xu hướng nhập hàng</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-black">Xu hướng nhập hàng</CardTitle>
      </CardHeader>
      <CardContent className="h-56 py-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700 }}
              tickFormatter={shortVnd}
              width={48}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "payableAmount" ? "Giá trị nhập" : "Đã trả",
              ]}
              labelStyle={{ fontWeight: 700 }}
            />
            <Bar
              dataKey="payableAmount"
              name="payableAmount"
              fill="var(--primary)"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="paidAmount"
              name="paidAmount"
              fill="var(--color-emerald-500, #10b981)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
