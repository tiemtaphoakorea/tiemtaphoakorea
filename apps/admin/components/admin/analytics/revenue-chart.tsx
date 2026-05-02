"use client";

import { formatCurrency } from "@workspace/shared/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data: any[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="border border-border shadow-sm lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black">Tổng quan doanh thu</CardTitle>
            <CardDescription className="font-medium">Xu hướng doanh thu theo tháng</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-4 h-[400px] py-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--slate-200))"
              opacity={0.5}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--slate-500))", fontSize: 11, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--slate-500))", fontSize: 11, fontWeight: 700 }}
              tickFormatter={(value) => `${value / 1000000}M`}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                      <p className="mb-2 text-[10px] font-black text-slate-400 uppercase">
                        {payload[0].payload.month}
                      </p>
                      <span className="text-primary text-xl font-black">
                        {formatCurrency(payload[0].value as number)}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
