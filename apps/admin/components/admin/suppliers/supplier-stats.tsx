import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Ban, CreditCard, TrendingUp, Truck } from "lucide-react";

interface SupplierStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalOrders: number;
  };
}

export function SupplierStats({ stats }: SupplierStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng NCC
          </CardTitle>
          <Truck className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
          <p className="text-primary mt-1 text-[10px] font-bold tracking-tight uppercase">
            Tất cả nhà cung cấp
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Đang hợp tác
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.active}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-emerald-500/80 uppercase">
            NCC hoạt động
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Ngừng hợp tác
          </CardTitle>
          <Ban className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.inactive}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-slate-400 uppercase">
            Đã ngừng hoạt động
          </p>
        </CardContent>
      </Card>

      <Card className="ring-primary/10 bg-primary/5 border-none shadow-sm ring-1 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-primary/70 text-sm font-black tracking-wider uppercase">
            Tổng đơn hàng
          </CardTitle>
          <CreditCard className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-primary text-2xl font-black">{stats.totalOrders}</div>
          <p className="text-primary/60 mt-1 text-xs font-bold tracking-tight uppercase">
            Đơn đã đặt từ NCC
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
