import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertCircle, CheckCircle2, Package, TrendingUp } from "lucide-react";

interface ProductStatsProps {
  stats: {
    total: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
  };
}

export function ProductStats({ stats }: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tổng sản phẩm
          </CardTitle>
          <Package className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-tight text-emerald-500 uppercase">
            <TrendingUp className="h-3 w-3" /> +2 tháng này
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Hết hàng
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.outOfStock}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-red-500/80 uppercase">
            Cần nhập hàng ngay
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/50 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-950/50 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Tồn kho thấp
          </CardTitle>
          <TrendingUp className="h-4 w-4 rotate-180 transform text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.lowStock}</div>
          <p className="mt-1 text-xs font-bold tracking-tight text-amber-500/80 uppercase">
            Dưới 10 sản phẩm
          </p>
        </CardContent>
      </Card>

      <Card className="ring-primary/10 bg-primary/5 dark:bg-primary/10 border-none shadow-sm ring-1 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-primary/70 text-sm font-black tracking-wider uppercase">
            Tổng giá trị
          </CardTitle>
          <CheckCircle2 className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-primary text-2xl font-black">{formatCurrency(stats.totalValue)}</div>
          <p className="text-primary/60 mt-1 text-xs font-bold tracking-tight uppercase">
            Dựa trên giá bán lẻ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
