import type { AnalyticsInventory } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { AlertTriangle, Archive, Box, PackageX, TrendingUp } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";

interface InventoryStatsProps {
  data: AnalyticsInventory;
}

export function InventoryStats({ data }: InventoryStatsProps) {
  const potentialProfit = data.totalRetailValue - data.totalCostValue;

  const valueItems: MetricStatItem[] = [
    {
      label: "Giá trị tồn (vốn)",
      value: formatCurrency(data.totalCostValue),
      icon: <Archive className="h-3.5 w-3.5" />,
      iconClassName: "bg-violet-500/10 text-violet-500",
      trend: { text: "Tính theo giá nhập", className: "text-muted-foreground" },
    },
    {
      label: "Giá trị tồn (bán)",
      value: formatCurrency(data.totalRetailValue),
      icon: <Box className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Tính theo giá bán", className: "text-muted-foreground" },
    },
  ];

  const alertItems: MetricStatItem[] = [
    {
      label: "Lợi nhuận tiềm năng",
      value: <span className="text-emerald-600">{formatCurrency(potentialProfit)}</span>,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      trend: {
        text: `${data.totalUnits.toLocaleString("vi-VN")} đơn vị tồn kho`,
        className: "text-muted-foreground",
      },
    },
    {
      label: "Sắp hết hàng",
      value: <span className="text-amber-600">{data.lowStockCount}</span>,
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      iconClassName: "bg-amber-500/10 text-amber-500",
      trend: { text: "Variant dưới ngưỡng tồn", className: "text-muted-foreground" },
    },
    {
      label: "Hết hàng",
      value: <span className="text-red-600">{data.outOfStockCount}</span>,
      icon: <PackageX className="h-3.5 w-3.5" />,
      iconClassName: "bg-red-500/10 text-red-500",
      trend: { text: "Variant hết hàng", className: "text-muted-foreground" },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <MetricStatBar items={valueItems} />
      <MetricStatBar items={alertItems} />
    </div>
  );
}
