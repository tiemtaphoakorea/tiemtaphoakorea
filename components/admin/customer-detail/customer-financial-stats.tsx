import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CustomerFinancialStatsProps {
  totalSpent: number;
  orderCount: number;
}

export function CustomerFinancialStats({ totalSpent, orderCount }: CustomerFinancialStatsProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-black tracking-tight uppercase">
          Thống kê tài chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 dark:bg-primary/20 space-y-1 rounded-3xl p-4">
          <span className="text-primary/60 text-[10px] font-black tracking-widest uppercase">
            Tổng chi tiêu
          </span>
          <div className="text-primary text-2xl font-black">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Số đơn hàng
            </span>
            <div className="text-xl font-black">{orderCount}</div>
          </div>
          <div className="space-y-1 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Tỉ lệ hoàn
            </span>
            <div className="text-xl font-black">0%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
