import type { AnalyticsInventory } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import { AlertTriangle, Archive, Box, PackageX, TrendingUp } from "lucide-react";
import Link from "next/link";

interface InventoryStatsProps {
  data: AnalyticsInventory;
  layout?: "row" | "column";
}

export function InventoryStats({ data, layout = "row" }: InventoryStatsProps) {
  const potentialProfit = data.totalRetailValue - data.totalCostValue;
  const profitPositive = potentialProfit >= 0;

  const stats = [
    {
      label: "Giá trị tồn (vốn)",
      value: formatCurrency(data.totalCostValue),
      icon: <Archive className="h-3.5 w-3.5" />,
      iconCls: "bg-violet-500/10 text-violet-500",
      valueCls: "text-slate-900",
      href: undefined,
    },
    {
      label: "Giá trị tồn (bán)",
      value: formatCurrency(data.totalRetailValue),
      icon: <Box className="h-3.5 w-3.5" />,
      iconCls: "bg-primary/10 text-primary",
      valueCls: "text-slate-900",
      href: undefined,
    },
    {
      label: "Lợi nhuận tiềm năng",
      value: formatCurrency(potentialProfit),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      iconCls: profitPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
      valueCls: profitPositive ? "text-emerald-600" : "text-red-600",
      href: undefined,
    },
    {
      label: "Sắp hết hàng",
      value: data.lowStockCount.toLocaleString("vi-VN"),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      iconCls: "bg-amber-500/10 text-amber-500",
      valueCls: data.lowStockCount > 0 ? "text-amber-600" : "text-slate-900",
      href: "/products?filter=low_stock",
    },
    {
      label: "Hết hàng",
      value: data.outOfStockCount.toLocaleString("vi-VN"),
      icon: <PackageX className="h-3.5 w-3.5" />,
      iconCls: "bg-red-500/10 text-red-500",
      valueCls: data.outOfStockCount > 0 ? "text-red-600" : "text-slate-900",
      href: "/products?filter=out_of_stock",
    },
  ];

  if (layout === "column") {
    return (
      <div className="flex flex-col divide-y divide-slate-100">
        {stats.map((s) => {
          const row = (
            <div
              key={s.label}
              className={`flex items-center justify-between gap-4 rounded-md py-3 pr-3 ${s.href ? "group cursor-pointer" : ""}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${s.iconCls}`}
                >
                  {s.icon}
                </span>
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {s.label}
                </span>
              </div>
              <span className={`shrink-0 text-right text-sm font-black tabular-nums ${s.valueCls}`}>
                {s.value}
              </span>
            </div>
          );

          return s.href ? (
            <Link key={s.label} href={s.href} className="rounded-md hover:bg-slate-50">
              {row}
            </Link>
          ) : (
            <div key={s.label}>{row}</div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => {
        const card = (
          <Card
            key={s.label}
            className={`border-none shadow-sm ring-1 ring-slate-200 ${s.href ? "cursor-pointer transition-shadow hover:shadow-md hover:ring-slate-300" : ""}`}
          >
            <CardContent className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${s.iconCls}`}
                >
                  {s.icon}
                </span>
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {s.label}
                </span>
              </div>
              <p className={`text-xl font-black tabular-nums ${s.valueCls}`}>{s.value}</p>
            </CardContent>
          </Card>
        );

        return s.href ? (
          <Link key={s.label} href={s.href}>
            {card}
          </Link>
        ) : (
          <div key={s.label}>{card}</div>
        );
      })}
    </div>
  );
}
