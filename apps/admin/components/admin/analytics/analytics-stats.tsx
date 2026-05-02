import { formatCurrency } from "@workspace/shared/utils";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";

interface AnalyticsStatsProps {
  data: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
  };
}

export function AnalyticsStats({ data }: AnalyticsStatsProps) {
  const items: MetricStatItem[] = [
    {
      label: "Doanh thu",
      value: formatCurrency(data.totalRevenue),
      icon: <DollarSign className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: {
        icon: <TrendingUp className="h-3 w-3" />,
        text: "5% dưới mục tiêu",
        className: "text-emerald-500",
      },
    },
    {
      label: "Đơn hàng",
      value: data.totalOrders.toLocaleString(),
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      iconClassName: "bg-blue-500/10 text-blue-500",
      trend: {
        icon: <TrendingUp className="h-3 w-3" />,
        text: "+12.5% tháng này",
        className: "text-emerald-500",
      },
    },
    {
      label: "Khách hàng",
      value: data.totalCustomers.toLocaleString(),
      icon: <Users className="h-3.5 w-3.5" />,
      iconClassName: "bg-violet-500/10 text-violet-500",
      trend: {
        icon: <TrendingUp className="h-3 w-3" />,
        text: "Tài khoản đã đăng ký",
        className: "text-emerald-500",
      },
    },
  ];

  return <MetricStatBar items={items} />;
}
