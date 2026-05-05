import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

interface CustomerFinancialStatsProps {
  totalSpent: number;
  orderCount: number;
}

export function CustomerFinancialStats({ totalSpent, orderCount }: CustomerFinancialStatsProps) {
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-black tracking-tight uppercase">
          Thống kê tài chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 space-y-1 rounded-3xl p-4">
          <span className="text-primary/60 text-xs font-black tracking-widest uppercase">
            Tổng chi tiêu
          </span>
          <div className="text-primary text-2xl font-black">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-3xl bg-slate-50 p-4">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Số đơn hàng
            </span>
            <div className="text-xl font-black">{orderCount}</div>
          </div>
          <div className="space-y-1 rounded-3xl bg-slate-50 p-4">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Giá trị TB / đơn
            </span>
            <div className="text-xl font-black">{formatCurrency(avgOrderValue)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
