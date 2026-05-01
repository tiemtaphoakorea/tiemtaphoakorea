import { formatCurrency } from "@workspace/shared/utils";
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
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
      <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
        <div className="bg-white px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
              Doanh thu
            </p>
            <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-black tabular-nums tracking-tight md:text-3xl">
            {formatCurrency(data.totalRevenue)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-bold tracking-tight uppercase">5% dưới mục tiêu</span>
          </div>
        </div>

        <div className="bg-white px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
              Đơn hàng
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-black tabular-nums tracking-tight md:text-3xl">
            {data.totalOrders.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-bold tracking-tight uppercase">+12.5% tháng này</span>
          </div>
        </div>

        <div className="bg-white px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
              Khách hàng
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-black tabular-nums tracking-tight md:text-3xl">
            {data.totalCustomers.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[10px] font-bold tracking-tight uppercase">
              Tài khoản đã đăng ký
            </span>
          </div>
        </div>

        <div className="bg-white px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
              Tỷ lệ chuyển đổi
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-black tabular-nums tracking-tight md:text-3xl">
            {data.conversionRate}%
          </p>
          <div className="mt-2 flex items-center gap-1 text-slate-400">
            <TrendingDown className="h-3 w-3" />
            <span className="text-[10px] font-bold tracking-tight uppercase">Ổn định</span>
          </div>
        </div>
      </div>
    </div>
  );
}
