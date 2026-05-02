import { Ban, CreditCard, TrendingUp, Truck } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";

interface SupplierStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalOrders: number;
  };
}

export function SupplierStats({ stats }: SupplierStatsProps) {
  const items: MetricStatItem[] = [
    {
      label: "Tổng NCC",
      value: stats.total,
      icon: <Truck className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Tất cả nhà cung cấp", className: "text-primary" },
    },
    {
      label: "Đang hợp tác",
      value: stats.active,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      trend: { text: "NCC hoạt động", className: "text-emerald-500" },
    },
    {
      label: "Ngừng hợp tác",
      value: stats.inactive,
      icon: <Ban className="h-3.5 w-3.5" />,
      iconClassName: "bg-slate-200 text-slate-400",
      trend: { text: "Đã ngừng hoạt động", className: "text-muted-foreground" },
    },
    {
      label: "Tổng đơn hàng",
      value: <span className="text-primary">{stats.totalOrders}</span>,
      icon: <CreditCard className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: { text: "Đơn đã đặt từ NCC", className: "text-primary" },
    },
  ];

  return <MetricStatBar items={items} />;
}
