import { formatCurrency } from "@workspace/shared/utils";
import { AlertCircle, CheckCircle2, Package, TrendingDown, TrendingUp } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";

interface ProductStatsProps {
  stats: {
    total: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
  };
}

export function ProductStats({ stats }: ProductStatsProps) {
  const items: MetricStatItem[] = [
    {
      label: "Tổng sản phẩm",
      value: stats.total,
      icon: <Package className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: {
        icon: <TrendingUp className="h-3 w-3" />,
        text: "+2 tháng này",
        className: "text-emerald-500",
      },
    },
    {
      label: "Hết hàng",
      value: stats.outOfStock,
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      iconClassName: "bg-red-500/10 text-red-500",
      trend: { text: "Cần nhập hàng ngay", className: "text-red-500" },
    },
    {
      label: "Tồn kho thấp",
      value: stats.lowStock,
      icon: <TrendingDown className="h-3.5 w-3.5" />,
      iconClassName: "bg-amber-500/10 text-amber-500",
      trend: { text: "Dưới 10 sản phẩm", className: "text-amber-500" },
    },
    {
      label: "Tổng giá trị",
      value: <span className="text-primary">{formatCurrency(stats.totalValue)}</span>,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Dựa trên giá bán lẻ", className: "text-primary" },
    },
  ];

  return <MetricStatBar items={items} />;
}
