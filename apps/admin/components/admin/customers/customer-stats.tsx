import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Ban, CreditCard, TrendingUp, Users } from "lucide-react";

interface CustomerStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalSpent: number;
  };
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng khách hàng
          </CardTitle>
          <Users className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
          <p className="mt-1 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
            Tất cả tài khoản
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Đang hoạt động
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.active}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-emerald-500/80 uppercase">
            Tài khoản khả dụng
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Ngừng hoạt động
          </CardTitle>
          <Ban className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.inactive}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-slate-400 uppercase">
            Đã bị chặn/khóa
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng doanh thu
          </CardTitle>
          <CreditCard className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(stats.totalSpent)}</div>
          <p className="mt-1 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
            Doanh thu lũy kế
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
