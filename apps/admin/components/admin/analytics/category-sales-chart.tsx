"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CategorySalesChartProps {
  data: any[];
}

export function CategorySalesChart({ data }: CategorySalesChartProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="text-xl font-black">Danh mục hot</CardTitle>
        <CardDescription className="font-medium">
          Hiệu suất bán hàng theo từng danh mục.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-4 h-[400px] py-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="hsl(var(--slate-200))"
              opacity={0.5}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="category"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "hsl(var(--slate-900))",
                fontSize: 12,
                fontWeight: 800,
              }}
              width={100}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--slate-50))", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-sm font-black text-slate-900 uppercase dark:text-white">
                        {payload[0].payload.category}
                      </p>
                      <p className="text-primary mt-1 text-xs font-bold">
                        {payload[0].value?.toLocaleString()} đơn hàng
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={32}>
              {data.map((entry: any) => (
                <Cell key={`cell-${entry.category}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 border-t border-slate-100 pt-6 dark:border-slate-800">
        <div className="text-muted-foreground text-[10px] leading-none font-medium">
          Hiển thị số lượng đơn hàng theo danh mục trong năm {currentYear}
        </div>
      </CardFooter>
    </Card>
  );
}
