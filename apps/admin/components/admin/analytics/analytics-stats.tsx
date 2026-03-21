import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { DollarSign, ShoppingBag, TrendingDown, TrendingUp, Users } from "lucide-react";

interface AnalyticsStatsProps {
  data: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    conversionRate: number;
  };
}

export function AnalyticsStats({ data }: AnalyticsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng doanh thu
          </CardTitle>
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(data.totalRevenue)}</div>
          <div className="mt-1 flex items-center gap-1 font-bold text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-tight uppercase">Dưới mục tiêu 5%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng đơn hàng
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{data.totalOrders}</div>
          <div className="mt-1 flex items-center gap-1 font-bold text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-tight uppercase">+12.5% tháng này</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Khách hàng
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{data.totalCustomers}</div>
          <div className="mt-1 flex items-center gap-1 font-bold text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-tight uppercase">Tài khoản khách hàng</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tỉ lệ chuyển đổi
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{data.conversionRate}%</div>
          <div className="mt-1 flex items-center gap-1 font-bold text-red-500">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-tight uppercase">Ổn định</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
