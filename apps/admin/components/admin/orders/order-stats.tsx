import { formatCurrency } from "@workspace/shared/utils";
import { CheckCircle2, Clock, ShoppingBag, TrendingUp } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";

interface OrderStatsProps {
  stats: {
    total: number;
    pending: number | undefined;
    completed: number | undefined;
    totalRevenue: number;
  };
}

export function OrderStats({ stats }: OrderStatsProps) {
  const items: MetricStatItem[] = [
    {
      label: "Tổng đơn hàng",
      value: stats.total,
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Lịch sử giao dịch", className: "text-primary" },
    },
    {
      label: "Chờ xử lý",
      value: stats.pending ?? "-",
      icon: <Clock className="h-3.5 w-3.5" />,
      iconClassName: "bg-amber-500/10 text-amber-500",
      trend: { text: "Cần xác nhận", className: "text-amber-500" },
    },
    {
      label: "Hoàn thành",
      value: stats.completed ?? "-",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      trend: { text: "Đã giao thành công", className: "text-emerald-500" },
    },
    {
      label: "Tổng doanh thu",
      value: formatCurrency(stats.totalRevenue),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Doanh thu thực tế", className: "text-primary" },
    },
  ];

  return <MetricStatBar items={items} />;
}
