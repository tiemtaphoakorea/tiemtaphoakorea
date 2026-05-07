"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { InventoryValuationItem } from "./inventory-valuation-table";

type CategorySummary = {
  name: string;
  skuCount: number;
  qty: number;
  value: number;
};

interface InventoryCategoryChartProps {
  items: InventoryValuationItem[];
  isLoading?: boolean;
}

function formatM(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function InventoryCategoryChart({ items, isLoading }: InventoryCategoryChartProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  // Aggregate by category
  const byCategory = items.reduce<Record<string, CategorySummary>>((acc, item) => {
    const key = item.categoryName || "Chưa phân loại";
    if (!acc[key]) acc[key] = { name: key, skuCount: 0, qty: 0, value: 0 };
    acc[key].skuCount++;
    acc[key].qty += item.onHand ?? 0;
    acc[key].value += Number(item.stockValue);
    return acc;
  }, {});

  const chartData = Object.values(byCategory).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-slate-200)"
              opacity={0.5}
            />
            <XAxis
              type="number"
              tickFormatter={formatM}
              tick={{ fontSize: 11, fill: "var(--color-slate-500)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: "var(--color-slate-600)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v: number) => `${v.toLocaleString("vi-VN")}đ`}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="value"
              name="Giá trị tồn"
              fill="var(--color-indigo-500)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              {["Danh mục", "SKU", "Số lượng", "Giá trị tồn"].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="px-4 py-2.5 font-medium">{row.name}</TableCell>
                <TableCell className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {row.skuCount}
                </TableCell>
                <TableCell className="px-4 py-2.5 tabular-nums">
                  {row.qty.toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="px-4 py-2.5 tabular-nums font-semibold">
                  {row.value.toLocaleString("vi-VN")}đ
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
