import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { CheckCircle2, Clock, ShoppingBag, TrendingUp } from "lucide-react";

interface OrderStatsProps {
  stats: {
    total: number;
    pending: number | undefined;
    completed: number | undefined;
    totalRevenue: number;
  };
}

export function OrderStats({ stats }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng đơn hàng
          </CardTitle>
          <ShoppingBag className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
          <p className="text-primary mt-1 text-[10px] font-bold tracking-tight uppercase">
            Lịch sử giao dịch
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Chờ xử lý
          </CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.pending ?? "-"}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-amber-500/80 uppercase">
            Cần xác nhận
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Hoàn thành
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.completed ?? "-"}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-emerald-500/80 uppercase">
            Đã giao thành công
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng doanh thu
          </CardTitle>
          <TrendingUp className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-primary mt-1 text-[10px] font-bold tracking-tight uppercase">
            Doanh thu thực tế
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
